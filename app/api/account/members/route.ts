import { NextResponse } from "next/server";
import { requireAccountMember } from "../../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../../lib/supabaseServerClient";
import { createRequestLogger } from "../../../../lib/logger";

const ROLE_VALUES = ["owner", "admin", "member", "viewer"] as const;
type AccountRole = (typeof ROLE_VALUES)[number];

const isAccountRole = (value: unknown): value is AccountRole =>
  typeof value === "string" && ROLE_VALUES.includes(value as AccountRole);

export async function GET(request: Request) {
  try {
    const { user, accountId, role, supabase } = await requireAccountMember(request);
    const supabaseAdmin = createSupabaseServerClient();
    const reqLogger = createRequestLogger("api", user.id);

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

    const responseMembers =
      members?.map((member) => {
        const profile = profileMap.get(member.user_id);
        return {
          userId: member.user_id,
          role: member.role,
          joinedAt: member.joined_at,
          email: profile?.email ?? null,
          fullName: profile?.fullName ?? null,
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

export async function PATCH(request: Request) {
  try {
    const { user, accountId, role, supabase } = await requireAccountMember(request);
    const reqLogger = createRequestLogger("api", user.id);

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
