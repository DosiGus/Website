import { createSupabaseServerClient } from "../supabaseServerClient";
import { FlowTrigger, FlowTriggerMatchType } from "../flowTypes";

export type MatchedFlow = {
  flowId: string;
  flowName: string;
  triggerId: string;
  startNodeId: string;
  nodes: any[];
  edges: any[];
  metadata?: Record<string, unknown> | null;
};

function deriveFallbackStartNodeId(nodes: any[], edges: any[]): string | null {
  const targets = new Set(
    edges.map((edge) => String(edge?.target ?? "")).filter(Boolean),
  );
  const rootNodes = nodes.filter((node) => !targets.has(String(node?.id ?? "")));
  if (rootNodes.length === 1) {
    return String(rootNodes[0].id);
  }

  const startNode = nodes.find(
    (node) => String(node?.id ?? "").toLowerCase() === "start",
  );
  if (startNode) {
    return String(startNode.id);
  }

  const welcomeNode = nodes.find(
    (node) => String(node?.id ?? "").toLowerCase() === "welcome",
  );
  if (welcomeNode) {
    return String(welcomeNode.id);
  }

  const inputNode = nodes.find(
    (node) => String(node?.type ?? "").toLowerCase() === "input",
  );
  if (inputNode) {
    return String(inputNode.id);
  }

  return null;
}

/**
 * Finds an active flow that matches the incoming message text.
 * Returns the first matching flow or null if no match.
 */
export async function findMatchingFlow(
  accountId: string,
  messageText: string
): Promise<MatchedFlow | null> {
  const supabase = createSupabaseServerClient();

  // Load all active flows for this account
  const { data: flows, error } = await supabase
    .from("flows")
    .select("id, name, triggers, nodes, edges, metadata")
    .eq("account_id", accountId)
    .eq("status", "Aktiv");

  if (error) {
    console.error("Error loading flows:", error);
    return null;
  }

  if (!flows || flows.length === 0) {
    return null;
  }

  const normalizedMessage = messageText.toLowerCase().trim();
  const matches: Array<MatchedFlow & { score: number }> = [];

  // Check each flow's triggers and score matches
  for (const flow of flows) {
    const triggers = flow.triggers as FlowTrigger[];
    const fallbackStartNodeId = deriveFallbackStartNodeId(
      (flow.nodes as any[]) ?? [],
      (flow.edges as any[]) ?? [],
    );

    if (!triggers || triggers.length === 0) {
      continue;
    }

    for (const trigger of triggers) {
      if (trigger.type !== "KEYWORD") {
        continue;
      }

      const keywords = trigger.config?.keywords || [];
      const matchType = trigger.config?.matchType || "CONTAINS";
      const startNodeId = trigger.startNodeId ?? fallbackStartNodeId;

      if (!startNodeId) {
        continue;
      }

      const matchScore = scoreKeywords(normalizedMessage, keywords, matchType);

      if (matchScore > 0) {
        matches.push({
          flowId: flow.id,
          flowName: flow.name,
          triggerId: trigger.id,
          startNodeId,
          nodes: flow.nodes,
          edges: flow.edges,
          metadata: flow.metadata ?? null,
          score: matchScore,
        });
      }
    }
  }

  if (matches.length === 0) {
    return null;
  }

  matches.sort((a, b) => b.score - a.score);
  const best = matches[0];
  return {
    flowId: best.flowId,
    flowName: best.flowName,
    triggerId: best.triggerId,
    startNodeId: best.startNodeId,
    nodes: best.nodes,
    edges: best.edges,
    metadata: best.metadata ?? null,
  };
}

export async function listTriggerKeywords(
  accountId: string,
  limit = 6
): Promise<string[]> {
  const supabase = createSupabaseServerClient();
  const { data: flows, error } = await supabase
    .from("flows")
    .select("triggers, nodes, edges")
    .eq("account_id", accountId)
    .eq("status", "Aktiv");

  if (error || !flows) {
    return [];
  }

  const keywords: string[] = [];
  const seen = new Set<string>();

  for (const flow of flows) {
    const triggers = flow.triggers as FlowTrigger[];
    if (!triggers || triggers.length === 0) continue;
    const fallbackStartNodeId = deriveFallbackStartNodeId(
      (flow.nodes as any[]) ?? [],
      (flow.edges as any[]) ?? [],
    );

    for (const trigger of triggers) {
      if (trigger.type !== "KEYWORD") continue;
      const startNodeId = trigger.startNodeId ?? fallbackStartNodeId;
      if (!startNodeId) continue;
      const triggerKeywords = trigger.config?.keywords || [];
      for (const keyword of triggerKeywords) {
        const normalized = String(keyword).trim();
        if (!normalized) continue;
        const key = normalized.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        keywords.push(normalized);
        if (keywords.length >= limit) {
          return keywords;
        }
      }
    }
  }

  return keywords;
}

/**
 * Checks if the message matches any of the keywords based on match type.
 */
function scoreKeywords(
  message: string,
  keywords: string[],
  matchType: FlowTriggerMatchType
): number {
  if (!keywords || keywords.length === 0) {
    return 0;
  }

  let bestScore = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();

    if (!normalizedKeyword) {
      continue;
    }

    const isMatch = matchKeyword(message, normalizedKeyword, matchType);
    if (isMatch) {
      const baseScore = matchType === "EXACT" ? 1000 : 100;
      bestScore = Math.max(bestScore, baseScore + normalizedKeyword.length);
    }
  }

  return bestScore;
}

function matchKeyword(
  message: string,
  keyword: string,
  matchType: FlowTriggerMatchType
): boolean {
  if (matchType === "EXACT") {
    return message === keyword;
  }

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundaryRegex = new RegExp(`(^|\\s|[.,!?])${escaped}($|\\s|[.,!?])`, "i");
  return boundaryRegex.test(message);
}

/**
 * Finds a flow by quick reply payload (for continuing conversations).
 * The payload format is expected to be: "flow:<flowId>:node:<nodeId>"
 */
export function parseQuickReplyPayload(
  payload: string
): { flowId: string; nodeId: string } | null {
  // Simple payload format: just the targetNodeId
  // Or structured: "flow:<flowId>:node:<nodeId>"
  const structuredMatch = payload.match(/^flow:([^:]+):node:(.+)$/);

  if (structuredMatch) {
    return {
      flowId: structuredMatch[1],
      nodeId: structuredMatch[2],
    };
  }

  return null;
}
