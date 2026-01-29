import { createSupabaseServerClient } from "../supabaseServerClient";
import { FlowTrigger, FlowTriggerMatchType } from "../flowTypes";

export type MatchedFlow = {
  flowId: string;
  flowName: string;
  triggerId: string;
  startNodeId: string;
  nodes: any[];
  edges: any[];
};

/**
 * Finds an active flow that matches the incoming message text.
 * Returns the first matching flow or null if no match.
 */
export async function findMatchingFlow(
  userId: string,
  messageText: string
): Promise<MatchedFlow | null> {
  const supabase = createSupabaseServerClient();

  // Load all active flows for this user
  const { data: flows, error } = await supabase
    .from("flows")
    .select("id, name, triggers, nodes, edges")
    .eq("user_id", userId)
    .eq("status", "Aktiv");

  if (error) {
    console.error("Error loading flows:", error);
    return null;
  }

  if (!flows || flows.length === 0) {
    return null;
  }

  const normalizedMessage = messageText.toLowerCase().trim();

  // Check each flow's triggers
  for (const flow of flows) {
    const triggers = flow.triggers as FlowTrigger[];

    if (!triggers || triggers.length === 0) {
      continue;
    }

    for (const trigger of triggers) {
      if (trigger.type !== "KEYWORD") {
        continue;
      }

      const keywords = trigger.config?.keywords || [];
      const matchType = trigger.config?.matchType || "CONTAINS";

      const isMatch = matchKeywords(normalizedMessage, keywords, matchType);

      if (isMatch && trigger.startNodeId) {
        return {
          flowId: flow.id,
          flowName: flow.name,
          triggerId: trigger.id,
          startNodeId: trigger.startNodeId,
          nodes: flow.nodes,
          edges: flow.edges,
        };
      }
    }
  }

  return null;
}

/**
 * Checks if the message matches any of the keywords based on match type.
 */
function matchKeywords(
  message: string,
  keywords: string[],
  matchType: FlowTriggerMatchType
): boolean {
  if (!keywords || keywords.length === 0) {
    return false;
  }

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();

    if (!normalizedKeyword) {
      continue;
    }

    if (matchType === "EXACT") {
      if (message === normalizedKeyword) {
        return true;
      }
    } else {
      // CONTAINS
      if (message.includes(normalizedKeyword)) {
        return true;
      }
    }
  }

  return false;
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
