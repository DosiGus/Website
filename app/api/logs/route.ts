import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../lib/apiAuth";

export async function GET(request: Request) {
  try {
    const { accountId, supabase, role } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "admin")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const source = searchParams.get("source");
    const rawLimit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const rawOffset = Number.parseInt(searchParams.get("offset") || "0", 10);
    const limit = Math.min(Number.isFinite(rawLimit) ? rawLimit : 50, 200);
    const offset = Number.isFinite(rawOffset) ? rawOffset : 0;

    let query = supabase
      .from("logs")
      .select("*", { count: "exact" })
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (level) {
      query = query.eq("level", level);
    }

    if (source) {
      query = query.eq("source", source);
    }

    const { data: logs, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Logs konnten nicht geladen werden" }, { status: 500 });
    }

    return NextResponse.json({
      logs,
      pagination: {
        total: count ?? 0,
        limit,
        offset,
        hasMore: (count ?? 0) > offset + limit,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
