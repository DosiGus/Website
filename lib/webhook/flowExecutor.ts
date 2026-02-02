import { FlowNodeData, FlowQuickReply, ConversationVariables } from "../flowTypes";
import { substituteVariables, hasPlaceholders } from "./variableSubstitutor";

export type FlowResponse = {
  text: string;
  imageUrl?: string;
  quickReplies: Array<{
    label: string;
    payload: string;
  }>;
  nextNodeId: string | null;
  isEndOfFlow: boolean;
};

type FlowNode = {
  id: string;
  type?: string;
  data: FlowNodeData;
  position: { x: number; y: number };
};

type FlowEdge = {
  id: string;
  source: string;
  target: string;
  data?: Record<string, unknown>;
};

type InputMode = "buttons" | "free_text";

function deriveInputMode(node: FlowNode, edges: FlowEdge[]): InputMode {
  const data = node.data as FlowNodeData;
  const configured = data.inputMode as InputMode | undefined;
  if (configured) return configured;
  const quickReplies = Array.isArray(data.quickReplies) ? data.quickReplies : [];
  if (quickReplies.length > 0) return "buttons";
  const hasFreeTextEdge = edges.some(
    (edge) => edge.source === node.id && !(edge.data as any)?.quickReplyId,
  );
  return hasFreeTextEdge ? "free_text" : "buttons";
}

/**
 * Executes a flow node and generates a response.
 * @param variables - Optional conversation variables for placeholder substitution
 */
export function executeFlowNode(
  nodeId: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  flowId: string,
  variables: ConversationVariables = {}
): FlowResponse | null {
  const node = nodes.find((n) => n.id === nodeId);

  if (!node) {
    console.error(`Node not found: ${nodeId}`);
    return null;
  }

  const nodeData = node.data;
  const inputMode = deriveInputMode(node, edges);
  // Apply variable substitution to the text
  const rawText = nodeData.text || nodeData.label || "";
  let text = substituteVariables(rawText, variables);

  if (node.id === "summary" && !hasPlaceholders(rawText)) {
    const summaryDetails = buildSummaryDetails(variables);
    if (summaryDetails) {
      text = `${text}\n\n${summaryDetails}`;
    }
  }

  // Find outgoing edges to determine next node(s)
  const outgoingEdges = edges.filter(
    (e) =>
      e.source === nodeId &&
      (inputMode !== "free_text" || !(e.data as any)?.quickReplyId),
  );

  // Build quick replies
  const quickReplies: FlowResponse["quickReplies"] = [];

  if (inputMode === "buttons" && nodeData.quickReplies && nodeData.quickReplies.length > 0) {
    // Use configured quick replies
    for (const qr of nodeData.quickReplies) {
      const targetNodeId = qr.targetNodeId || findNextNode(nodeId, edges);
      quickReplies.push({
        label: qr.label,
        payload: targetNodeId
          ? `flow:${flowId}:node:${targetNodeId}`
          : qr.payload || qr.label,
      });
    }
  } else if (inputMode === "buttons" && outgoingEdges.length === 1) {
    // Single path - no quick replies needed, auto-advance later
  } else if (inputMode === "buttons" && outgoingEdges.length > 1) {
    // Multiple paths without quick replies - create default options
    for (const edge of outgoingEdges) {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (targetNode) {
        const label = targetNode.data.label || targetNode.data.text?.slice(0, 20) || "Weiter";
        quickReplies.push({
          label,
          payload: `flow:${flowId}:node:${edge.target}`,
        });
      }
    }
  }

  // Determine next node (for single-path flows)
  const nextNodeId = outgoingEdges.length === 1 ? outgoingEdges[0].target : null;

  // Check if this is the end of the flow
  const isEndOfFlow = outgoingEdges.length === 0 && quickReplies.length === 0;

  return {
    text,
    imageUrl: nodeData.imageUrl || undefined,
    quickReplies,
    nextNodeId,
    isEndOfFlow,
  };
}

/**
 * Handles a quick reply selection and returns the next node's response.
 * @param variables - Optional conversation variables for placeholder substitution
 */
export function handleQuickReplySelection(
  selectedPayload: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  flowId: string,
  variables: ConversationVariables = {}
): FlowResponse | null {
  // Parse the payload to get the target node ID
  const match = selectedPayload.match(/^flow:([^:]+):node:(.+)$/);

  if (match && match[1] === flowId) {
    const targetNodeId = match[2];
    return executeFlowNode(targetNodeId, nodes, edges, flowId, variables);
  }

  // Payload might be a direct node ID (legacy format)
  const nodeExists = nodes.some((n) => n.id === selectedPayload);
  if (nodeExists) {
    return executeFlowNode(selectedPayload, nodes, edges, flowId, variables);
  }

  return null;
}

/**
 * Finds the next node in a linear flow path.
 */
function findNextNode(nodeId: string, edges: FlowEdge[]): string | null {
  const edge = edges.find((e) => e.source === nodeId);
  return edge?.target || null;
}

function buildSummaryDetails(variables: ConversationVariables): string | null {
  const lines: string[] = [];

  if (variables.date) lines.push("Datum: {{date}}");
  if (variables.time) lines.push("Uhrzeit: {{time}}");
  if (variables.guestCount) lines.push("Personen: {{guestCount}}");
  if (variables.name) lines.push("Name: {{name}}");
  if (variables.phone) lines.push("Telefon: {{phone}}");
  if (variables.email) lines.push("E-Mail: {{email}}");
  if (variables.specialRequests) lines.push("Wünsche: {{specialRequests}}");

  if (lines.length === 0) {
    return null;
  }

  return substituteVariables(lines.join("\n"), variables);
}

export type FreeTextResult = {
  response: FlowResponse;
  executedNodeId: string;
};

/**
 * Handles free text input when the user is at a node that expects text (no quick replies).
 * Returns the next node's response if the current node has a single outgoing edge.
 * @param variables - Optional conversation variables for placeholder substitution
 */
export function handleFreeTextInput(
  currentNodeId: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  flowId: string,
  variables: ConversationVariables = {}
): FreeTextResult | null {
  const currentNode = nodes.find((n) => n.id === currentNodeId);

  if (!currentNode) {
    return null;
  }

  const inputMode = deriveInputMode(currentNode, edges);

  // Check if this node expects free text input:
  // - inputMode is free_text (explicit or derived)
  // - Has at least one non-quick-reply outgoing edge
  const outgoingEdges = edges.filter(
    (e) =>
      e.source === currentNodeId &&
      (inputMode !== "free_text" || !(e.data as any)?.quickReplyId),
  );

  if (inputMode !== "free_text") {
    // Node is configured for buttons, don't handle as free text
    return null;
  }

  if (outgoingEdges.length === 0) {
    return null;
  }

  // Get the next node (follow the first/only edge)
  const nextNodeId = outgoingEdges[0].target;

  if (!nextNodeId) {
    return null;
  }

  // Execute the next node with variables
  const response = executeFlowNode(nextNodeId, nodes, edges, flowId, variables);

  if (!response) {
    return null;
  }

  return {
    response,
    executedNodeId: nextNodeId,
  };
}

/**
 * Validates that a flow has at least one valid path.
 */
export function validateFlowPath(
  startNodeId: string,
  nodes: FlowNode[],
  edges: FlowEdge[]
): boolean {
  const visited = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (visited.has(currentId)) {
      continue;
    }

    visited.add(currentId);

    const node = nodes.find((n) => n.id === currentId);
    if (!node) {
      return false; // Invalid node reference
    }

    // Find next nodes
    const outgoing = edges.filter((e) => e.source === currentId);
    for (const edge of outgoing) {
      queue.push(edge.target);
    }

    // Also check quick reply targets
    const quickReplies = node.data.quickReplies || [];
    for (const qr of quickReplies) {
      if (qr.targetNodeId) {
        queue.push(qr.targetNodeId);
      }
    }
  }

  return visited.size > 0;
}
