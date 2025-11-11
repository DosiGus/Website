import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServerClient";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("flows")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const body = await request.json();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("flows")
    .update({
      name: body.name,
      status: body.status,
      nodes: body.nodes,
      edges: body.edges,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
