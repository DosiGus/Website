import { createSupabaseUserClient } from "./supabaseServerClient";
import { SupabaseClient, User } from "@supabase/supabase-js";

export type AuthenticatedUser = {
  user: User;
  token: string;
  supabase: SupabaseClient;
};

export async function requireUser(request: Request): Promise<AuthenticatedUser> {
  const authorization = request.headers.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authorization.split(" ")[1];
  const supabase = createSupabaseUserClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error("Unauthorized");
  }
  return { user, token, supabase };
}

export type AccountMemberResult = {
  user: User;
  token: string;
  supabase: SupabaseClient;
  accountId: string;
  role: "owner" | "admin" | "member" | "viewer";
};

const ROLE_PRIORITY: Record<AccountMemberResult["role"], number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

export function isRoleAtLeast(
  role: AccountMemberResult["role"],
  minimumRole: AccountMemberResult["role"],
): boolean {
  return ROLE_PRIORITY[role] >= ROLE_PRIORITY[minimumRole];
}

function resolveAccountIdFromRequest(request: Request): string | null {
  const headerAccountId = request.headers.get("x-account-id");
  if (headerAccountId) return headerAccountId;

  try {
    const url = new URL(request.url);
    return (
      url.searchParams.get("account_id") ||
      url.searchParams.get("accountId") ||
      null
    );
  } catch {
    return null;
  }
}

type RequireAccountOptions = {
  accountId?: string | null;
};

/**
 * Validates the request JWT and resolves the user's account membership.
 * Returns the user, their primary account_id, and their role.
 */
export async function requireAccountMember(
  request: Request,
  options: RequireAccountOptions = {}
): Promise<AccountMemberResult> {
  const { user, token, supabase } = await requireUser(request);
  const requestedAccountId =
    options.accountId ?? resolveAccountIdFromRequest(request);

  const { data: memberships, error } = await supabase
    .from("account_members")
    .select("account_id, role, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error || !memberships || memberships.length === 0) {
    throw new Error("No account membership found");
  }

  let membership =
    requestedAccountId
      ? memberships.find((row) => row.account_id === requestedAccountId)
      : null;

  if (!membership) {
    const sorted = [...memberships].sort((a, b) => {
      const roleDelta =
        ROLE_PRIORITY[(b.role as AccountMemberResult["role"]) ?? "viewer"] -
        ROLE_PRIORITY[(a.role as AccountMemberResult["role"]) ?? "viewer"];
      if (roleDelta !== 0) return roleDelta;
      const aJoined = a.joined_at ? new Date(a.joined_at).getTime() : 0;
      const bJoined = b.joined_at ? new Date(b.joined_at).getTime() : 0;
      return aJoined - bJoined;
    });
    membership = sorted[0];
  }

  if (!membership) {
    throw new Error("No account membership found");
  }

  return {
    user,
    token,
    supabase,
    accountId: membership.account_id,
    role: membership.role as AccountMemberResult["role"],
  };
}
