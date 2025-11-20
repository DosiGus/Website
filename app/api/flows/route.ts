import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";
import {
  defaultNodes,
  defaultEdges,
  defaultTriggers,
  defaultMetadata,
} from "../../../lib/defaultFlow";
import { requireUser } from "../../../lib/apiAuth";
import { fallbackTemplates } from "../../../lib/flowTemplates";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("flows")
      .select("id, name, status, updated_at, nodes, edges, triggers, metadata")
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
    const templateId: string | undefined = body.templateId;
    const customNodes = body.nodes;
    const customEdges = body.edges;
    const customTriggers = body.triggers;
    const customMetadata = body.metadata;
    const supabase = createSupabaseServerClient();
    let nodesToUse = defaultNodes;
    let edgesToUse = defaultEdges;
    let triggersToUse = defaultTriggers;
    let metadataToUse = defaultMetadata;

    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from("flow_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (template && !templateError) {
        nodesToUse = template.nodes as any;
        edgesToUse = template.edges as any;
        triggersToUse =
          (template.triggers as any) && Array.isArray(template.triggers)
            ? (template.triggers as any)
            : defaultTriggers;
        metadataToUse = (template.metadata as any) ?? defaultMetadata;
      } else {
        const fallback = fallbackTemplates.find((tpl) => tpl.id === templateId);
        if (fallback) {
          nodesToUse = fallback.nodes as any;
          edgesToUse = fallback.edges as any;
          triggersToUse = fallback.triggers as any;
          metadataToUse = fallback.metadata ?? defaultMetadata;
        }
      }
    } else {
      if (customNodes && customEdges) {
        nodesToUse = customNodes;
        edgesToUse = customEdges;
      }
      if (customTriggers) {
        triggersToUse = customTriggers;
      }
      if (customMetadata) {
        metadataToUse = customMetadata;
      }
    }

    const { data, error } = await supabase
      .from("flows")
      .insert({
        user_id: user.id,
        name,
        nodes: nodesToUse,
        edges: edgesToUse,
        triggers: triggersToUse,
        metadata: metadataToUse,
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
