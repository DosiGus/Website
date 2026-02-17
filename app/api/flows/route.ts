import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";
import {
  defaultMetadata,
  getDefaultFlowPreset,
} from "../../../lib/defaultFlow";
import { type VerticalKey } from "../../../lib/verticals";
import { requireUser, requireAccountMember } from "../../../lib/apiAuth";
import { fallbackTemplates } from "../../../lib/flowTemplates";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../lib/rateLimit";

export async function GET(request: Request) {
  try {
    const { user, accountId } = await requireAccountMember(request);

    // Rate limiting
    const rateLimit = await checkRateLimit(`flows:${accountId}`, RATE_LIMITS.generous);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("flows")
      .select("id, name, status, updated_at, nodes, edges, triggers, metadata")
      .eq("account_id", accountId)
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
    const { user, accountId } = await requireAccountMember(request);

    // Rate limiting
    const rateLimit = await checkRateLimit(`flows:${accountId}`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json();
    const name = body.name ?? "Neuer Flow";
    const templateId: string | undefined = body.templateId;
    const customNodes = body.nodes;
    const customEdges = body.edges;
    const customTriggers = body.triggers;
    const customMetadata = body.metadata;
    const supabase = createSupabaseServerClient();
    const { data: account } = await supabase
      .from("accounts")
      .select("vertical")
      .eq("id", accountId)
      .single();
    const accountVertical = (account?.vertical as VerticalKey | null) ?? null;
    const defaultPreset = getDefaultFlowPreset(accountVertical);
    let nodesToUse = defaultPreset.nodes;
    let edgesToUse = defaultPreset.edges;
    let triggersToUse = defaultPreset.triggers;
    let metadataToUse = defaultPreset.metadata;

    if (templateId) {
      // PRIORITY: Check code templates FIRST (they are always up-to-date)
      const codeTemplate = fallbackTemplates.find((tpl) => tpl.id === templateId);

      if (codeTemplate) {
        // Use code template (always up-to-date)
        nodesToUse = codeTemplate.nodes as any;
        edgesToUse = codeTemplate.edges as any;
        triggersToUse = codeTemplate.triggers as any;
        metadataToUse = codeTemplate.metadata ?? defaultMetadata;
      } else {
        // Only check DB for custom/user-created templates
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
              : defaultPreset.triggers;
          metadataToUse = (template.metadata as any) ?? defaultMetadata;
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
        account_id: accountId,
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
