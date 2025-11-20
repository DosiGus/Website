import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";
import { fallbackTemplates } from "../../../lib/flowTemplates";
import { requireUser } from "../../../lib/apiAuth";
import { slugify } from "../../../lib/slugify";
import { defaultMetadata } from "../../../lib/defaultFlow";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("flow_templates")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    return NextResponse.json(fallbackTemplates);
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const flowId = body.flowId as string | undefined;
    if (!flowId) {
      return NextResponse.json(
        { error: "flowId fehlt für Template-Erstellung." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: flow, error: flowError } = await supabase
      .from("flows")
      .select("id, name, user_id, nodes, edges, triggers, metadata")
      .eq("id", flowId)
      .single();

    if (flowError || !flow || flow.user_id !== user.id) {
      return NextResponse.json(
        { error: "Flow konnte nicht geladen werden oder du hast keinen Zugriff." },
        { status: 404 },
      );
    }

    const templateName =
      (body.name as string | undefined)?.trim() || `${flow.name} Template`;
    const description =
      (body.description as string | undefined)?.trim() ||
      "Aus einem bestehenden Flow gespeichert.";
    const vertical =
      (body.vertical as string | undefined)?.trim() || "Benutzerdefiniert";
    const slugBase = slugify(templateName) || "flow-template";
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

    const { data, error } = await supabase
      .from("flow_templates")
      .insert({
        slug,
        name: templateName,
        vertical,
        description,
        nodes: flow.nodes,
        edges: flow.edges,
        triggers: flow.triggers ?? [],
        metadata: flow.metadata ?? defaultMetadata,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
