import { NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/apiAuth";
import { defaultMetadata } from "../../../../../lib/defaultFlow";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user, supabase } = await requireUser(request);
    const { data, error } = await supabase
      .from("flows")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Flow nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      status: data.status,
      triggers: data.triggers ?? [],
      nodes: data.nodes ?? [],
      edges: data.edges ?? [],
      metadata: data.metadata ?? defaultMetadata,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
