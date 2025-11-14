import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";
import { defaultNodes, defaultEdges } from "../../../lib/defaultFlow";
import { requireUser } from "../../../lib/apiAuth";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("flows")
      .select("id, name, status, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const name = body.name ?? "Neuer Flow";
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("flows")
      .insert({
        user_id: user.id,
        name,
        nodes: defaultNodes,
        edges: defaultEdges,
        status: "Entwurf",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
