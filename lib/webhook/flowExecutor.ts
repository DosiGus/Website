import { FlowNodeData, FlowQuickReply } from "../flowTypes";

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
};

/**
 * Executes a flow node and generates a response.
 */
export function executeFlowNode(
  nodeId: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  flowId: string
): FlowResponse | null {
  const node = nodes.find((n) => n.id === nodeId);

  if (!node) {
    console.error(`Node not found: ${nodeId}`);
    return null;
  }

  const nodeData = node.data;
  const text = nodeData.text || nodeData.label || "";

  // Find outgoing edges to determine next node(s)
  const outgoingEdges = edges.filter((e) => e.source === nodeId);

  // Build quick replies
  const quickReplies: FlowResponse["quickReplies"] = [];

  if (nodeData.quickReplies && nodeData.quickReplies.length > 0) {
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
  } else if (outgoingEdges.length === 1) {
    // Single path - no quick replies needed, auto-advance later
  } else if (outgoingEdges.length > 1) {
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
 */
export function handleQuickReplySelection(
  selectedPayload: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  flowId: string
): FlowResponse | null {
  // Parse the payload to get the target node ID
  const match = selectedPayload.match(/^flow:([^:]+):node:(.+)$/);

  if (match && match[1] === flowId) {
    const targetNodeId = match[2];
    return executeFlowNode(targetNodeId, nodes, edges, flowId);
  }

  // Payload might be a direct node ID (legacy format)
  const nodeExists = nodes.some((n) => n.id === selectedPayload);
  if (nodeExists) {
    return executeFlowNode(selectedPayload, nodes, edges, flowId);
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
