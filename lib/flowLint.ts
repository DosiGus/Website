import { Edge, Node } from "reactflow";

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

export function lintFlow(nodes: Node[], edges: Edge[]): FlowLintResult {
  const warnings: FlowLintWarning[] = [];
  if (nodes.length === 0) {
    warnings.push(
      buildWarning("Flow enthält keine Nodes. Bitte starte mit einer Nachricht."),
    );
    return { warnings };
  }

  const outgoingMap = new Map<string, number>();
  edges.forEach((edge) => {
    outgoingMap.set(edge.source, (outgoingMap.get(edge.source) ?? 0) + 1);
  });

  nodes.forEach((node) => {
    if (!outgoingMap.get(node.id) && node.type !== "output") {
      warnings.push(
        buildWarning(
          `Node "${node.data?.label ?? node.id}" endet ohne Verbindung.`,
          node.id,
          "Verbinde ihn mit einer Bestätigung oder zurück zum Start.",
        ),
      );
    }
    const outgoingCount = outgoingMap.get(node.id) ?? 0;
    if (node.data?.variant === "choice" && outgoingCount > 3) {
      warnings.push(
        buildWarning(
          `Node "${node.data?.label ?? node.id}" hat ${outgoingCount} Antworten.`,
          node.id,
          "Reduziere auf maximal drei Quick Replies für bessere UX.",
        ),
      );
    }
  });

  // BFS reachability
  const startId = nodes[0]?.id;
  if (startId) {
    const visited = new Set<string>([startId]);
    const queue = [startId];
    while (queue.length) {
      const current = queue.shift()!;
      edges
        .filter((edge) => edge.source === current && !visited.has(edge.target))
        .forEach((edge) => {
          visited.add(edge.target);
          queue.push(edge.target);
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

  const unlabeledEdge = edges.find((edge) => !edge.data?.condition);
  if (unlabeledEdge) {
    warnings.push(
      buildWarning(
        "Mindestens eine Verbindung hat kein Label. Vermerke 'Ja/Nein' oder Bedingungen.",
        unlabeledEdge.id,
        "Vergib ein Label unter \"Kanten\" im Editor.",
        "info",
      ),
    );
  }

  return { warnings };
}
