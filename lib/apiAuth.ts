import { createSupabaseServerClient } from "./supabaseServerClient";
import { User } from "@supabase/supabase-js";

export async function requireUser(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authorization.split(" ")[1];
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export type AccountMemberResult = {
  user: User;
  accountId: string;
  role: "owner" | "admin" | "member" | "viewer";
};

/**
 * Validates the request JWT and resolves the user's account membership.
 * Returns the user, their primary account_id, and their role.
 */
export async function requireAccountMember(
  request: Request
): Promise<AccountMemberResult> {
  const user = await requireUser(request);
  const supabase = createSupabaseServerClient();

  const { data: membership, error } = await supabase
    .from("account_members")
    .select("account_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (error || !membership) {
    throw new Error("No account membership found");
  }

  return {
    user,
    accountId: membership.account_id,
    role: membership.role as AccountMemberResult["role"],
  };
}
