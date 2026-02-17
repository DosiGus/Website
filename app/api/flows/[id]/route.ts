import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../../lib/apiAuth";
import { defaultMetadata } from "../../../../lib/defaultFlow";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { accountId, supabase } = await requireAccountMember(request);
    const { data, error } = await supabase
      .from("flows")
      .select("*")
      .eq("id", params.id)
      .eq("account_id", accountId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { accountId, role, supabase } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    const body = await request.json();
    const { error } = await supabase
      .from("flows")
      .update({
        name: body.name,
        status: body.status,
        nodes: body.nodes,
        edges: body.edges,
        triggers: body.triggers ?? [],
        metadata: body.metadata ?? defaultMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("account_id", accountId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { accountId, role, supabase } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    const { error } = await supabase
      .from("flows")
      .delete()
      .eq("id", params.id)
      .eq("account_id", accountId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
