import { NextResponse } from "next/server";
import { requireAccountMember } from "../../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../../lib/supabaseServerClient";
import { createRequestLogger } from "../../../../lib/logger";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../lib/rateLimit";
import { sendEmail } from "../../../../lib/email/resend";

const ROLE_VALUES = ["owner", "admin", "member", "viewer"] as const;
type AccountRole = (typeof ROLE_VALUES)[number];

const isAccountRole = (value: unknown): value is AccountRole =>
  typeof value === "string" && ROLE_VALUES.includes(value as AccountRole);

export async function GET(request: Request) {
  try {
    const { user, accountId, role, supabase } = await requireAccountMember(request);
    const supabaseAdmin = createSupabaseServerClient();
    const reqLogger = createRequestLogger("api", user.id, accountId);

    const { data: members, error } = await supabase
      .from("account_members")
      .select("user_id, role, joined_at")
      .eq("account_id", accountId)
      .order("joined_at", { ascending: true });

    if (error) {
      await reqLogger.error("api", "Failed to load account members", {
        userId: user.id,
        metadata: { accountId, error: error.message },
      });
      return NextResponse.json({ error: "Fehler beim Laden der Mitglieder" }, { status: 500 });
    }

    const userIds = (members ?? []).map((member) => member.user_id);
    let profileMap = new Map<
      string,
      { email: string | null; fullName: string | null }
    >();

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .schema("auth")
        .from("users")
        .select("id, email, raw_user_meta_data")
        .in("id", userIds);

      if (!usersError && users) {
        profileMap = new Map(
          users.map((userRow) => {
            const rawMeta =
              (userRow as { raw_user_meta_data?: Record<string, unknown> })
                .raw_user_meta_data ?? {};
            const fullName =
              (rawMeta.full_name as string | undefined) ||
              (rawMeta.name as string | undefined) ||
              null;
            return [userRow.id, { email: userRow.email, fullName }];
          })
        );
      }
    }

    const canViewPII = role === "owner" || role === "admin";
    const responseMembers =
      members?.map((member) => {
        const profile = profileMap.get(member.user_id);
        return {
          userId: member.user_id,
          role: member.role,
          joinedAt: member.joined_at,
          email: canViewPII ? profile?.email ?? null : null,
          fullName: canViewPII ? profile?.fullName ?? null : null,
        };
      }) ?? [];

    return NextResponse.json({
      members: responseMembers,
      currentUserId: user.id,
      currentUserRole: role,
      canManage: role === "owner" || role === "admin",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, accountId, role, supabase } = await requireAccountMember(request);
    const supabaseAdmin = createSupabaseServerClient();
    const reqLogger = createRequestLogger("api", user.id, accountId);

    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    const rateLimit = await checkRateLimit(`invite:${accountId}`, RATE_LIMITS.strict);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const body = (await request.json()) as { email?: string; role?: string };
    const inviteEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const inviteRole = body?.role;

    if (!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
    }
    if (!isAccountRole(inviteRole) || inviteRole === "owner") {
      return NextResponse.json({ error: "Ungültige Rolle. Erlaubt: admin, member, viewer." }, { status: 400 });
    }

    const { data: account } = await supabase
      .from("accounts")
      .select("name")
      .eq("id", accountId)
      .single();
    const accountName = (account as { name?: string } | null)?.name ?? "Wesponde";

    // Check if user already exists in auth.users
    const { data: existingAuthUsers } = await supabaseAdmin
      .schema("auth")
      .from("users")
      .select("id, email")
      .eq("email", inviteEmail)
      .limit(1);

    const existingAuthUser = (existingAuthUsers as Array<{ id: string; email: string }> | null)?.[0] ?? null;

    if (existingAuthUser) {
      // Check if already a member of this account
      const { data: existingMember } = await supabaseAdmin
        .from("account_members")
        .select("id")
        .eq("account_id", accountId)
        .eq("user_id", existingAuthUser.id)
        .maybeSingle();

      if (existingMember) {
        return NextResponse.json(
          { error: "Diese Person ist bereits Mitglied dieses Accounts." },
          { status: 400 }
        );
      }

      const { error: insertError } = await supabaseAdmin
        .from("account_members")
        .insert({ account_id: accountId, user_id: existingAuthUser.id, role: inviteRole });

      if (insertError) {
        await reqLogger.error("api", `Failed to add account member: ${insertError.message}`);
        return NextResponse.json({ error: "Mitglied konnte nicht hinzugefügt werden." }, { status: 500 });
      }

      const inviterName = (user as any).user_metadata?.full_name ?? user.email ?? "Ein Administrator";
      void sendEmail({
        to: [inviteEmail],
        subject: `Du wurdest zu ${accountName} auf Wesponde hinzugefügt`,
        html: buildInviteEmail({ type: "added", inviterName, accountName, role: inviteRole }),
      });

      await reqLogger.info("api", "Account member added directly", {
        metadata: { accountId, targetEmail: inviteEmail, role: inviteRole },
      });
      return NextResponse.json({ message: "Mitglied hinzugefügt.", added: true }, { status: 201 });
    }

    // User doesn't exist yet — send Supabase invite
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(inviteEmail, {
      data: {
        invited_account_id: accountId,
        invited_role: inviteRole,
        invited_account_name: accountName,
      },
    });

    if (inviteError) {
      await reqLogger.error("api", `Failed to send invite: ${inviteError.message}`);
      return NextResponse.json(
        { error: "Einladung konnte nicht gesendet werden. Bitte versuche es erneut." },
        { status: 500 }
      );
    }

    await reqLogger.info("api", "Account member invited (new user)", {
      metadata: { accountId, targetEmail: inviteEmail, role: inviteRole },
    });
    return NextResponse.json({ message: "Einladung gesendet.", invited: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, accountId, role, supabase } = await requireAccountMember(request);
    const supabaseAdmin = createSupabaseServerClient();
    const reqLogger = createRequestLogger("api", user.id, accountId);

    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    const body = (await request.json()) as { userId?: string };
    const targetUserId = body?.userId;

    if (!targetUserId) {
      return NextResponse.json({ error: "userId fehlt." }, { status: 400 });
    }

    // Can't remove yourself
    if (targetUserId === user.id) {
      return NextResponse.json({ error: "Du kannst dich nicht selbst entfernen." }, { status: 400 });
    }

    const { data: targetMember } = await supabaseAdmin
      .from("account_members")
      .select("user_id, role")
      .eq("account_id", accountId)
      .eq("user_id", targetUserId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Mitglied nicht gefunden." }, { status: 404 });
    }

    // Only owner can remove other owners
    if (targetMember.role === "owner" && role !== "owner") {
      return NextResponse.json({ error: "Nur Owner können Owner entfernen." }, { status: 403 });
    }

    // Ensure at least one owner remains
    if (targetMember.role === "owner") {
      const { count: ownerCount } = await supabaseAdmin
        .from("account_members")
        .select("user_id", { count: "exact", head: true })
        .eq("account_id", accountId)
        .eq("role", "owner");

      if ((ownerCount ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Mindestens ein Owner muss bestehen bleiben." },
          { status: 400 }
        );
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from("account_members")
      .delete()
      .eq("account_id", accountId)
      .eq("user_id", targetUserId);

    if (deleteError) {
      await reqLogger.error("api", `Failed to remove account member: ${deleteError.message}`);
      return NextResponse.json({ error: "Mitglied konnte nicht entfernt werden." }, { status: 500 });
    }

    await reqLogger.info("api", "Account member removed", {
      metadata: { accountId, targetUserId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

function buildInviteEmail({
  type,
  inviterName,
  accountName,
  role,
}: {
  type: "added" | "invited";
  inviterName: string;
  accountName: string;
  role: string;
}): string {
  const roleLabel: Record<string, string> = {
    admin: "Admin",
    member: "Mitarbeiter",
    viewer: "Viewer",
  };
  const roleText = roleLabel[role] ?? role;
  const appUrl = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ?? "https://wesponde.com";

  if (type === "added") {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#171923">
        <h2 style="color:#2450b2">Du bist jetzt Teil von ${accountName}</h2>
        <p>${inviterName} hat dich als <strong>${roleText}</strong> zu <strong>${accountName}</strong> auf Wesponde hinzugefügt.</p>
        <p>Du kannst dich jetzt einloggen und den Account verwalten.</p>
        <a href="${appUrl}/app" style="display:inline-block;background:#121624;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:16px">
          Zu Wesponde
        </a>
        <p style="margin-top:32px;color:#67718a;font-size:12px">Wesponde · DM-Automatisierung für deinen Betrieb</p>
      </div>
    `;
  }

  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#171923">
      <h2 style="color:#2450b2">Einladung zu ${accountName}</h2>
      <p>Du wurdest eingeladen, <strong>${accountName}</strong> auf Wesponde als <strong>${roleText}</strong> zu verwalten.</p>
      <p>Erstelle deinen Account und du hast sofort Zugriff.</p>
      <p style="margin-top:32px;color:#67718a;font-size:12px">Wesponde · DM-Automatisierung für deinen Betrieb</p>
    </div>
  `;
}

export async function PATCH(request: Request) {
  try {
    const { user, accountId, role, supabase } = await requireAccountMember(request);
    const reqLogger = createRequestLogger("api", user.id, accountId);

    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    const body = (await request.json()) as {
      userId?: string;
      role?: string;
    };
    const targetUserId = body?.userId;
    const nextRole = body?.role;

    if (!targetUserId || !isAccountRole(nextRole)) {
      return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
    }

    const { data: targetMember, error: targetError } = await supabase
      .from("account_members")
      .select("user_id, role")
      .eq("account_id", accountId)
      .eq("user_id", targetUserId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
    }

    if (role !== "owner" && targetMember.role === "owner") {
      return NextResponse.json({ error: "Nur Owner dürfen Owner-Rollen ändern" }, { status: 403 });
    }

    if (role !== "owner" && nextRole === "owner") {
      return NextResponse.json({ error: "Nur Owner dürfen Owner vergeben" }, { status: 403 });
    }

    if (targetMember.role === nextRole) {
      return NextResponse.json({ member: targetMember });
    }

    if (targetMember.role === "owner" && nextRole !== "owner") {
      const { count: ownerCount, error: ownerError } = await supabase
        .from("account_members")
        .select("user_id", { count: "exact", head: true })
        .eq("account_id", accountId)
        .eq("role", "owner");

      if (ownerError) {
        return NextResponse.json({ error: ownerError.message }, { status: 500 });
      }

      if ((ownerCount ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Mindestens ein Owner muss bestehen bleiben." },
          { status: 400 }
        );
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("account_members")
      .update({ role: nextRole })
      .eq("account_id", accountId)
      .eq("user_id", targetUserId)
      .select("user_id, role")
      .single();

    if (updateError || !updated) {
      await reqLogger.error("api", "Failed to update account member role", {
        userId: user.id,
        metadata: {
          accountId,
          targetUserId,
          error: updateError?.message ?? "unknown",
        },
      });
      return NextResponse.json({ error: "Update fehlgeschlagen" }, { status: 500 });
    }

    await reqLogger.info("api", "Account member role updated", {
      userId: user.id,
      metadata: {
        accountId,
        targetUserId,
        previousRole: targetMember.role,
        newRole: nextRole,
      },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
