import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";
import { fallbackTemplates } from "../../../lib/flowTemplates";
import { requireUser } from "../../../lib/apiAuth";
import { slugify } from "../../../lib/slugify";
import { defaultMetadata } from "../../../lib/defaultFlow";

export async function GET() {
  const supabase = createSupabaseServerClient();

  // Load custom templates from database
  const { data: dbTemplates } = await supabase
    .from("flow_templates")
    .select("*")
    .order("name", { ascending: true });

  // Code templates always take priority (they are always up-to-date)
  // Only add DB templates that are NOT in the code templates (custom user templates)
  const codeTemplateIds = new Set(fallbackTemplates.map((t) => t.id));
  const codeTemplateSlugs = new Set(fallbackTemplates.map((t) => t.slug));

  const customTemplates = (dbTemplates || []).filter(
    (t) => !codeTemplateIds.has(t.id) && !codeTemplateSlugs.has(t.slug)
  );

  // Return code templates first, then custom templates
  const allTemplates = [...fallbackTemplates, ...customTemplates];

  return NextResponse.json(allTemplates);
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser(request);
    const body = await request.json();
    const flowId = body.flowId as string | undefined;
    if (!flowId) {
      return NextResponse.json(
        { error: "flowId fehlt für Template-Erstellung." },
        { status: 400 },
      );
    }

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

    const supabaseAdmin = createSupabaseServerClient();
    const { data, error } = await supabaseAdmin
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
