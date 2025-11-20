import { Edge, Node } from "reactflow";
import type { FlowTrigger, FlowQuickReply } from "./flowTypes";

export type FlowLintSeverity = "info" | "warning";

export type FlowLintWarning = {
  id: string;
  message: string;
  severity: FlowLintSeverity;
  nodeId?: string;
  suggestion?: string;
};

export type FlowLintResult = {
  warnings: FlowLintWarning[];
};

function buildWarning(
  message: string,
  nodeId?: string,
  suggestion?: string,
  severity: FlowLintSeverity = "warning",
): FlowLintWarning {
  return {
    id: `${nodeId ?? "flow"}-${message.slice(0, 24)}-${severity}`.replace(/\s+/g, "-"),
    message,
    severity,
    nodeId,
    suggestion,
  };
}

export function lintFlow(
  nodes: Node[],
  edges: Edge[],
  triggers: FlowTrigger[] = [],
): FlowLintResult {
  const warnings: FlowLintWarning[] = [];
  if (nodes.length === 0) {
    warnings.push(
      buildWarning("Flow enthält keine Nodes. Bitte starte mit einer Nachricht."),
    );
    return { warnings };
  }

  if (triggers.length === 0) {
    warnings.push(
      buildWarning(
        "Es ist kein Trigger hinterlegt. Ohne Trigger kann der Flow nicht starten.",
      ),
    );
  } else {
    triggers.forEach((trigger) => {
      if (!trigger.config.keywords.length) {
        warnings.push(
          buildWarning(
            `Trigger "${trigger.id}" hat keine Keywords.`,
            trigger.startNodeId ?? "flow",
            "Füge mindestens ein Schlüsselwort hinzu.",
          ),
        );
      }
      if (!trigger.startNodeId) {
        warnings.push(
          buildWarning(
            `Trigger "${trigger.id}" hat keinen Start-Node.`,
            trigger.startNodeId ?? "flow",
            "Wähle einen Node als Einstieg.",
          ),
        );
      }
    });
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const outgoingMap = new Map<string, Edge[]>();
  edges.forEach((edge) => {
    outgoingMap.set(edge.source, [...(outgoingMap.get(edge.source) ?? []), edge]);
    if (!edge.data?.condition) {
      warnings.push(
        buildWarning(
          "Mindestens eine Verbindung hat kein Label.",
          edge.source,
          "Vergib ein Label unter \"Kanten\" im Editor.",
          "info",
        ),
      );
    }
  });

  nodes.forEach((node) => {
    const nodeLabel = node.data?.label ?? node.id;
    const hasText = Boolean(node.data?.text && node.data.text.trim().length > 0);
    const hasImage = Boolean(node.data?.imageUrl);
    if (!hasText && !hasImage) {
      warnings.push(
        buildWarning(
          `Node "${nodeLabel}" hat weder Text noch Bild.`,
          node.id,
          "Fülle den Inhalt aus oder füge ein Bild hinzu.",
        ),
      );
    }
    const quickReplies: FlowQuickReply[] = Array.isArray(node.data?.quickReplies)
      ? (node.data?.quickReplies as FlowQuickReply[])
      : [];
    const outgoingEdges = outgoingMap.get(node.id) ?? [];
    if (outgoingEdges.length > 0 && quickReplies.length === 0) {
      warnings.push(
        buildWarning(
          `Node "${nodeLabel}" hat Verbindungen, aber keine Quick Replies.`,
          node.id,
          "Füge Buttons hinzu oder entferne nicht genutzte Kanten.",
        ),
      );
    }
    const payloadSet = new Set<string>();
    quickReplies.forEach((reply) => {
      if (reply.payload) {
        if (payloadSet.has(reply.payload)) {
          warnings.push(
            buildWarning(
              `Node "${nodeLabel}" enthält doppelte Payload "${reply.payload}".`,
              node.id,
              "Jede Quick Reply sollte eine eindeutige Payload haben.",
            ),
          );
        }
        payloadSet.add(reply.payload);
      }
      if (!reply.targetNodeId || !nodeIds.has(reply.targetNodeId)) {
        warnings.push(
          buildWarning(
            `Quick Reply "${reply.label || reply.id}" führt zu keinem Node.`,
            node.id,
            "Wähle einen Ziel-Node aus.",
          ),
        );
      }
    });
  });

  // BFS reachability
  const startIds = triggers
    .map((trigger) => trigger.startNodeId)
    .filter((value): value is string => Boolean(value));
  const entryId = startIds[0] ?? nodes[0]?.id;
  if (entryId) {
    const visited = new Set<string>([entryId]);
    const queue = [entryId];
    while (queue.length) {
      const current = queue.shift()!;
      (outgoingMap.get(current) ?? []).forEach((edge) => {
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
        }
      });
    }
    nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        warnings.push(
          buildWarning(
            `Node "${node.data?.label ?? node.id}" ist nicht erreichbar.`,
            node.id,
            "Verbinde ihn vom Start oder einem vorherigen Schritt.",
          ),
        );
      }
    });
  }

  return { warnings };
}
