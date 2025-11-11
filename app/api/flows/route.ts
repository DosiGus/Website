import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";
import { defaultNodes, defaultEdges } from "../../../lib/defaultFlow";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("flows")
    .select("id, name, status, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = body.userId;
  const name = body.name ?? "Neuer Flow";
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("flows")
    .insert({
      user_id: userId,
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
}
