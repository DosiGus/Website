import { Edge, Node } from "reactflow";

export type FlowLintResult = {
  warnings: string[];
};

export function lintFlow(nodes: Node[], edges: Edge[]): FlowLintResult {
  const warnings: string[] = [];
  if (nodes.length === 0) {
    warnings.push("Flow enthält keine Nodes.");
    return { warnings };
  }
  const outgoingMap = new Map<string, number>();
  edges.forEach((edge) => {
    outgoingMap.set(edge.source, (outgoingMap.get(edge.source) ?? 0) + 1);
  });

  nodes.forEach((node) => {
    if (!outgoingMap.get(node.id) && node.type !== "output") {
      warnings.push(`Node "${node.data?.label ?? node.id}" endet ohne Verbindung.`);
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
        warnings.push(`Node "${node.data?.label ?? node.id}" ist nicht erreichbar.`);
      }
    });
  }

  return { warnings };
}
