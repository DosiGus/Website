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

export function deriveFallbackStartNodeId(nodes: any[], edges: any[]): string | null {
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
    .select("id, name, triggers, nodes, edges, metadata, updated_at")
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
  const matches: Array<MatchedFlow & { score: number; updatedAt: string }> = [];

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
          updatedAt: flow.updated_at ?? "",
        });
      }
    }
  }

  if (matches.length === 0) {
    return null;
  }

  // Primary sort: highest score wins.
  // Tiebreaker 1: lower metadata.priority wins (operator-controlled ordering).
  // Tiebreaker 2: most recently updated flow wins (deterministic fallback).
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aPriority = (a.metadata as any)?.priority ?? 999;
    const bPriority = (b.metadata as any)?.priority ?? 999;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
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
 * Loads a specific flow by ID and returns it as a MatchedFlow.
 * Used when we know exactly which flow to restart (e.g. "Neue Reservierung"
 * after a previous booking — we restart the same flow that created it).
 * Returns null if the flow doesn't exist or is no longer active.
 */
export async function loadFlowById(flowId: string): Promise<MatchedFlow | null> {
  const supabase = createSupabaseServerClient();

  const { data: flow, error } = await supabase
    .from("flows")
    .select("id, name, triggers, nodes, edges, metadata, status")
    .eq("id", flowId)
    .single();

  if (error || !flow || flow.status !== "Aktiv") return null;

  const nodes = (flow.nodes as any[]) ?? [];
  const edges = (flow.edges as any[]) ?? [];
  const triggers = (flow.triggers as FlowTrigger[]) ?? [];

  const firstTrigger = triggers.find((t) => t.type === "KEYWORD");
  const startNodeId =
    firstTrigger?.startNodeId ?? deriveFallbackStartNodeId(nodes, edges);

  if (!startNodeId) return null;

  return {
    flowId: flow.id,
    flowName: flow.name,
    triggerId: firstTrigger?.id ?? "__direct_load__",
    startNodeId,
    nodes,
    edges,
    metadata: flow.metadata ?? null,
  };
}

const BOOKING_COLLECTS = new Set(["date", "time", "name", "guestcount"]);

/**
 * Finds the best booking/reservation flow for an account without keyword matching.
 * Used when a user explicitly requests a new booking (e.g. via "Neue Reservierung" button)
 * regardless of the keyword used — works for Gastro ("reservieren"), Fitness ("termin"),
 * Beauty ("buchen"), etc.
 *
 * Scoring:
 *  +3  metadata.output_config.type === "reservation" (explicit reservation flow)
 *  +2  flow has nodes with collects in [date, time, name, guestCount]
 *  +1  any active flow (last-resort fallback when account has exactly one flow)
 *
 * Returns null if no active flow with a resolvable startNodeId exists.
 */
export async function findBookingFlow(accountId: string): Promise<MatchedFlow | null> {
  const supabase = createSupabaseServerClient();

  const { data: flows, error } = await supabase
    .from("flows")
    .select("id, name, triggers, nodes, edges, metadata")
    .eq("account_id", accountId)
    .eq("status", "Aktiv");

  if (error || !flows || flows.length === 0) {
    return null;
  }

  const candidates: Array<MatchedFlow & { score: number }> = [];

  for (const flow of flows) {
    const nodes = (flow.nodes as any[]) ?? [];
    const edges = (flow.edges as any[]) ?? [];
    const triggers = (flow.triggers as FlowTrigger[]) ?? [];
    const meta = (flow.metadata ?? {}) as Record<string, unknown>;

    // Resolve startNodeId: prefer explicit trigger.startNodeId, then fallback
    const firstTrigger = triggers.find((t) => t.type === "KEYWORD");
    const startNodeId =
      firstTrigger?.startNodeId ??
      deriveFallbackStartNodeId(nodes, edges);

    if (!startNodeId) continue;

    const triggerId = firstTrigger?.id ?? "__force_new__";

    // Score by booking relevance
    let score = 1; // base: any active flow

    if ((meta as any)?.output_config?.type === "reservation") {
      score += 3;
    }

    const hasBookingNodes = nodes.some((n: any) =>
      BOOKING_COLLECTS.has(String(n?.data?.collects ?? "").toLowerCase())
    );
    if (hasBookingNodes) score += 2;

    candidates.push({
      flowId: flow.id,
      flowName: flow.name,
      triggerId,
      startNodeId,
      nodes,
      edges,
      metadata: flow.metadata ?? null,
      score,
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
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

export type CrossFlowConflict = {
  keyword: string;
  matchType: string;
  conflictingFlowId: string;
  conflictingFlowName: string;
};

/**
 * Checks if any keywords in the given triggers overlap with keywords in other
 * active flows of the same account. Returns one entry per conflicting keyword.
 *
 * Used at flow activation to warn the operator — non-blocking, informational only.
 */
export async function findCrossFlowConflicts(
  accountId: string,
  currentFlowId: string,
  triggers: FlowTrigger[]
): Promise<CrossFlowConflict[]> {
  if (!triggers || triggers.length === 0) return [];

  // Collect keywords from the current flow being activated
  const currentKeywords = new Map<string, string>(); // normalized → matchType
  for (const trigger of triggers) {
    if (trigger.type !== "KEYWORD") continue;
    const matchType = trigger.config?.matchType ?? "CONTAINS";
    for (const kw of trigger.config?.keywords ?? []) {
      const normalized = String(kw).toLowerCase().trim();
      if (normalized) currentKeywords.set(normalized, matchType);
    }
  }

  if (currentKeywords.size === 0) return [];

  const supabase = createSupabaseServerClient();
  const { data: otherFlows, error } = await supabase
    .from("flows")
    .select("id, name, triggers")
    .eq("account_id", accountId)
    .eq("status", "Aktiv")
    .neq("id", currentFlowId);

  if (error || !otherFlows) return [];

  const conflicts: CrossFlowConflict[] = [];
  const seen = new Set<string>(); // deduplicate by keyword+flowId

  for (const flow of otherFlows) {
    const otherTriggers = (flow.triggers as FlowTrigger[]) ?? [];
    for (const trigger of otherTriggers) {
      if (trigger.type !== "KEYWORD") continue;
      for (const kw of trigger.config?.keywords ?? []) {
        const normalized = String(kw).toLowerCase().trim();
        if (!normalized) continue;
        if (!currentKeywords.has(normalized)) continue;

        const dedupeKey = `${normalized}:${flow.id}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        conflicts.push({
          keyword: kw,
          matchType: currentKeywords.get(normalized) ?? "CONTAINS",
          conflictingFlowId: flow.id,
          conflictingFlowName: flow.name,
        });
      }
    }
  }

  return conflicts;
}
