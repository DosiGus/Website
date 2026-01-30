import { Edge, Node } from "reactflow";
import type { FlowTrigger, FlowQuickReply } from "./flowTypes";

export type FlowLintSeverity = "info" | "warning";

export type FlowLintWarning = {
  id: string;
  message: string;
  severity: FlowLintSeverity;
  nodeId?: string;
  edgeId?: string;
  suggestion?: string;
  action?: string;
};

export type FlowLintResult = {
  warnings: FlowLintWarning[];
};

function buildWarning(
  message: string,
  options: {
    nodeId?: string;
    edgeId?: string;
    suggestion?: string;
    action?: string;
    severity?: FlowLintSeverity;
  } = {},
): FlowLintWarning {
  const { nodeId, edgeId, suggestion, action, severity = "warning" } = options;
  return {
    id: `${nodeId ?? edgeId ?? "flow"}-${message.slice(0, 24)}-${severity}`.replace(/\s+/g, "-"),
    message,
    severity,
    nodeId,
    edgeId,
    suggestion,
    action,
  };
}

export function lintFlow(
  nodes: Node[],
  edges: Edge[],
  triggers: FlowTrigger[] = [],
): FlowLintResult {
  const warnings: FlowLintWarning[] = [];

  // === FLOW LEVEL CHECKS ===
  if (nodes.length === 0) {
    warnings.push(
      buildWarning("Dein Flow ist noch leer", {
        suggestion: "Klicke oben auf '+ Nachricht' um deinen ersten Schritt hinzuzufügen.",
        action: "Schritt hinzufügen",
      }),
    );
    return { warnings };
  }

  // === TRIGGER CHECKS ===
  if (triggers.length === 0) {
    warnings.push(
      buildWarning("Kein Auslöser vorhanden", {
        suggestion: "Dein Flow braucht einen Auslöser, damit er startet. Klicke links auf 'Neuer Trigger' und füge Wörter hinzu, auf die der Bot reagieren soll (z.B. 'Hallo', 'Reservieren').",
        action: "Auslöser erstellen",
      }),
    );
  } else {
    triggers.forEach((trigger, index) => {
      const triggerLabel = trigger.config.keywords.length > 0
        ? `"${trigger.config.keywords[0]}"${trigger.config.keywords.length > 1 ? ` (+${trigger.config.keywords.length - 1})` : ""}`
        : `Auslöser ${index + 1}`;

      if (!trigger.config.keywords.length) {
        warnings.push(
          buildWarning(`Auslöser ${triggerLabel} hat keine Schlüsselwörter`, {
            nodeId: trigger.startNodeId ?? undefined,
            suggestion: "Bearbeite den Auslöser und füge mindestens ein Wort hinzu, das Kunden schreiben könnten (z.B. 'Hallo', 'Termin').",
            action: "Wörter hinzufügen",
          }),
        );
      }
      if (!trigger.startNodeId) {
        warnings.push(
          buildWarning(`Auslöser ${triggerLabel} hat keinen Startpunkt`, {
            suggestion: "Bearbeite den Auslöser und wähle aus, welche Nachricht zuerst gesendet werden soll.",
            action: "Startpunkt wählen",
          }),
        );
      } else if (!nodes.some((n) => n.id === trigger.startNodeId)) {
        warnings.push(
          buildWarning(`Auslöser ${triggerLabel} verweist auf einen gelöschten Schritt`, {
            suggestion: "Der ursprüngliche Startpunkt wurde gelöscht. Wähle einen neuen Startpunkt aus.",
            action: "Startpunkt aktualisieren",
          }),
        );
      }
    });
  }

  // === EDGE CHECKS ===
  const nodeIds = new Set(nodes.map((node) => node.id));
  const outgoingMap = new Map<string, Edge[]>();

  edges.forEach((edge) => {
    outgoingMap.set(edge.source, [...(outgoingMap.get(edge.source) ?? []), edge]);

    // Check for missing labels - only for manually created edges (no quickReplyId)
    const isQuickReplyEdge = Boolean((edge.data as any)?.quickReplyId);
    const hasLabel = Boolean(edge.data?.condition || edge.label);

    if (!hasLabel && !isQuickReplyEdge) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      const sourceLabel = sourceNode?.data?.label ?? "Unbekannt";
      const targetLabel = targetNode?.data?.label ?? "Unbekannt";

      warnings.push(
        buildWarning(`Verbindung von "${sourceLabel}" zu "${targetLabel}" ohne Beschriftung`, {
          nodeId: edge.source,
          edgeId: edge.id,
          suggestion: "Tipp: Nutze stattdessen Antwort-Buttons! Buttons sind für Kunden einfacher zu bedienen als unsichtbare Verbindungen.",
          action: "Button erstellen",
          severity: "info",
        }),
      );
    }
  });

  // === NODE CHECKS ===
  nodes.forEach((node) => {
    const nodeLabel = node.data?.label ?? "Ohne Titel";
    const hasText = Boolean(node.data?.text && node.data.text.trim().length > 0);
    const hasImage = Boolean(node.data?.imageUrl);

    // Empty node check
    if (!hasText && !hasImage) {
      warnings.push(
        buildWarning(`"${nodeLabel}" hat keinen Inhalt`, {
          nodeId: node.id,
          suggestion: "Wähle diesen Schritt aus und schreibe eine Nachricht, die der Bot senden soll.",
          action: "Text schreiben",
        }),
      );
    }

    // Quick replies check
    const quickReplies: FlowQuickReply[] = Array.isArray(node.data?.quickReplies)
      ? (node.data?.quickReplies as FlowQuickReply[])
      : [];
    const outgoingEdges = outgoingMap.get(node.id) ?? [];

    // Has edges but no quick replies
    if (outgoingEdges.length > 0 && quickReplies.length === 0) {
      warnings.push(
        buildWarning(`"${nodeLabel}" hat keine Antwort-Buttons`, {
          nodeId: node.id,
          suggestion: "Füge Antwort-Buttons hinzu, damit Kunden auf diese Nachricht antworten können. Die Buttons führen dann zum nächsten Schritt.",
          action: "Buttons hinzufügen",
        }),
      );
    }

    // Check quick replies
    quickReplies.forEach((reply, index) => {
      const replyLabel = reply.label || `Button ${index + 1}`;

      // Missing target
      if (!reply.targetNodeId) {
        warnings.push(
          buildWarning(`Button "${replyLabel}" führt nirgendwo hin`, {
            nodeId: node.id,
            suggestion: `Wähle bei "${replyLabel}" unter 'Weiterleiten zu' aus, was nach dem Klick passieren soll.`,
            action: "Ziel wählen",
          }),
        );
      } else if (!nodeIds.has(reply.targetNodeId)) {
        warnings.push(
          buildWarning(`Button "${replyLabel}" verweist auf gelöschten Schritt`, {
            nodeId: node.id,
            suggestion: "Der Ziel-Schritt wurde gelöscht. Wähle ein neues Ziel aus.",
            action: "Neues Ziel wählen",
          }),
        );
      }
    });
  });

  // === REACHABILITY CHECK (BFS) ===
  const startIds = triggers
    .map((trigger) => trigger.startNodeId)
    .filter((value): value is string => Boolean(value))
    .filter((value) => nodeIds.has(value));

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

      // Also check quick reply targets
      const node = nodes.find((n) => n.id === current);
      const quickReplies = (node?.data?.quickReplies ?? []) as FlowQuickReply[];
      quickReplies.forEach((reply) => {
        if (reply.targetNodeId && !visited.has(reply.targetNodeId)) {
          visited.add(reply.targetNodeId);
          queue.push(reply.targetNodeId);
        }
      });
    }

    // Find unreachable nodes
    nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        const nodeLabel = node.data?.label ?? "Ohne Titel";
        warnings.push(
          buildWarning(`"${nodeLabel}" ist nicht erreichbar`, {
            nodeId: node.id,
            suggestion: "Dieser Schritt ist nicht mit dem Rest des Flows verbunden. Verbinde ihn mit einem anderen Schritt oder lösche ihn, falls er nicht gebraucht wird.",
            action: "Verbinden oder löschen",
          }),
        );
      }
    });
  }

  return { warnings };
}
