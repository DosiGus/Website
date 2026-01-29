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
      buildWarning("Dein Flow ist leer.", {
        suggestion: "Klicke auf '+ Nachricht' um deinen ersten Schritt hinzuzufügen.",
        action: "Node hinzufügen",
      }),
    );
    return { warnings };
  }

  // === TRIGGER CHECKS ===
  if (triggers.length === 0) {
    warnings.push(
      buildWarning("Kein Trigger vorhanden - der Flow kann nicht starten.", {
        suggestion: "Klicke links auf 'Neuer Trigger' und füge Keywords hinzu, die den Flow auslösen (z.B. 'reservieren', 'termin').",
        action: "Trigger erstellen",
      }),
    );
  } else {
    triggers.forEach((trigger, index) => {
      const triggerLabel = trigger.config.keywords.length > 0
        ? `"${trigger.config.keywords[0]}"${trigger.config.keywords.length > 1 ? ` (+${trigger.config.keywords.length - 1})` : ""}`
        : `Trigger ${index + 1}`;

      if (!trigger.config.keywords.length) {
        warnings.push(
          buildWarning(`Trigger ${triggerLabel} hat keine Keywords.`, {
            nodeId: trigger.startNodeId ?? undefined,
            suggestion: "Bearbeite den Trigger und füge mindestens ein Keyword hinzu, das Kunden schreiben könnten.",
            action: "Trigger bearbeiten",
          }),
        );
      }
      if (!trigger.startNodeId) {
        warnings.push(
          buildWarning(`Trigger ${triggerLabel} führt zu keinem Node.`, {
            suggestion: "Bearbeite den Trigger und wähle unter 'Start Node' aus, welche Nachricht zuerst gesendet werden soll.",
            action: "Start-Node wählen",
          }),
        );
      } else if (!nodes.some((n) => n.id === trigger.startNodeId)) {
        warnings.push(
          buildWarning(`Trigger ${triggerLabel} verweist auf einen gelöschten Node.`, {
            suggestion: "Bearbeite den Trigger und wähle einen existierenden Node als Start aus.",
            action: "Start-Node aktualisieren",
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
    // Quick Reply edges get labels automatically from the button text
    const isQuickReplyEdge = Boolean((edge.data as any)?.quickReplyId);
    const hasLabel = Boolean(edge.data?.condition || edge.label);

    if (!hasLabel && !isQuickReplyEdge) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      const sourceLabel = sourceNode?.data?.label ?? "Unbekannt";
      const targetLabel = targetNode?.data?.label ?? "Unbekannt";

      warnings.push(
        buildWarning(`Manuelle Verbindung "${sourceLabel}" → "${targetLabel}" hat kein Label.`, {
          nodeId: edge.source,
          edgeId: edge.id,
          suggestion: "Tipp: Erstelle stattdessen einen Quick Reply Button im Quell-Node. Buttons sind benutzerfreundlicher als unsichtbare Verbindungen.",
          action: "Quick Reply nutzen",
          severity: "info",
        }),
      );
    }
  });

  // === NODE CHECKS ===
  nodes.forEach((node) => {
    const nodeLabel = node.data?.label ?? "Unbenannter Node";
    const hasText = Boolean(node.data?.text && node.data.text.trim().length > 0);
    const hasImage = Boolean(node.data?.imageUrl);

    // Empty node check
    if (!hasText && !hasImage) {
      warnings.push(
        buildWarning(`"${nodeLabel}" hat keinen Inhalt.`, {
          nodeId: node.id,
          suggestion: "Wähle den Node aus und schreibe eine Nachricht ins Textfeld oder füge ein Bild hinzu.",
          action: "Inhalt hinzufügen",
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
        buildWarning(`"${nodeLabel}" hat Verbindungen, aber keine Buttons.`, {
          nodeId: node.id,
          suggestion: "Füge Quick Reply Buttons hinzu, damit Nutzer auf diese Nachricht antworten können. Die Buttons führen dann zum nächsten Schritt.",
          action: "Quick Reply hinzufügen",
        }),
      );
    }

    // Check quick replies
    const payloadSet = new Set<string>();
    quickReplies.forEach((reply, index) => {
      const replyLabel = reply.label || `Button ${index + 1}`;

      // Duplicate payload
      if (reply.payload) {
        if (payloadSet.has(reply.payload)) {
          warnings.push(
            buildWarning(`"${nodeLabel}" hat doppelte Button-Payloads.`, {
              nodeId: node.id,
              suggestion: `Der Payload "${reply.payload}" wird mehrfach verwendet. Gib jedem Button einen eindeutigen Payload.`,
              action: "Payload anpassen",
            }),
          );
        }
        payloadSet.add(reply.payload);
      }

      // Missing target
      if (!reply.targetNodeId) {
        warnings.push(
          buildWarning(`Button "${replyLabel}" in "${nodeLabel}" führt nirgendwo hin.`, {
            nodeId: node.id,
            suggestion: "Wähle unter 'Weiterleiten zu' aus, welcher Node nach dem Klick angezeigt werden soll.",
            action: "Ziel-Node wählen",
          }),
        );
      } else if (!nodeIds.has(reply.targetNodeId)) {
        warnings.push(
          buildWarning(`Button "${replyLabel}" verweist auf einen gelöschten Node.`, {
            nodeId: node.id,
            suggestion: "Der Ziel-Node existiert nicht mehr. Wähle einen anderen Node als Ziel aus.",
            action: "Ziel-Node aktualisieren",
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
        const nodeLabel = node.data?.label ?? "Unbenannter Node";
        warnings.push(
          buildWarning(`"${nodeLabel}" ist nicht erreichbar.`, {
            nodeId: node.id,
            suggestion: "Dieser Node ist nicht mit dem Flow verbunden. Erstelle eine Verbindung von einem anderen Node hierher, oder lösche ihn falls er nicht gebraucht wird.",
            action: "Node verbinden oder löschen",
          }),
        );
      }
    });
  }

  return { warnings };
}
