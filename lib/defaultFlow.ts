import { Edge, Node } from "reactflow";
import type { FlowTrigger, FlowMetadata, FlowQuickReply } from "./flowTypes";
import { getWizardCopy, type VerticalKey } from "./verticals";

const makeQuickReply = (
  id: string,
  label: string,
  targetNodeId: string,
): FlowQuickReply => ({
  id,
  label,
  payload: label.toUpperCase().replace(/\s+/g, "_"),
  targetNodeId,
});

const buildDefaultNodes = (vertical?: VerticalKey | null): Node[] => {
  const copy = getWizardCopy(vertical);
  const actionLabel = copy.flowNameSuffix === "Reservierung" ? "Reservierung anstoßen" : "Terminbuchung anstoßen";
  const primaryActionLabel = copy.flowNameSuffix === "Reservierung" ? "Reservieren" : "Termin buchen";

  return [
    {
      id: "start",
      position: { x: 120, y: 80 },
      type: "wesponde",
      data: {
        label: "Willkommen bei Wesponde! Wie kann ich dir helfen?",
        text: "Willkommen bei Wesponde! Wie kann ich dir helfen?",
        variant: "message",
        inputMode: "buttons",
        quickReplies: [
          makeQuickReply("qr-reservieren", primaryActionLabel, "option-reservation"),
          makeQuickReply("qr-fragen", "Fragen", "option-faq"),
        ],
      },
    },
    {
      id: "option-reservation",
      position: { x: 380, y: 40 },
      type: "wesponde",
      data: {
        label: actionLabel,
        text: actionLabel,
        variant: "choice",
        inputMode: "buttons",
        quickReplies: [],
      },
    },
    {
      id: "option-faq",
      position: { x: 380, y: 140 },
      type: "wesponde",
      data: {
        label: "Fragen beantworten",
        text: "Fragen beantworten",
        variant: "choice",
        inputMode: "buttons",
        quickReplies: [],
      },
    },
  ];
};

const buildDefaultEdges = (vertical?: VerticalKey | null): Edge[] => {
  const copy = getWizardCopy(vertical);
  const primaryActionLabel = copy.flowNameSuffix === "Reservierung" ? "Reservieren" : "Termin buchen";
  return [
    {
      id: "e-start-res",
      source: "start",
      target: "option-reservation",
      data: { tone: "positive", condition: primaryActionLabel },
      label: primaryActionLabel,
    },
    {
      id: "e-start-faq",
      source: "start",
      target: "option-faq",
      data: { tone: "neutral", condition: "Fragen" },
      label: "Fragen",
    },
  ];
};

const buildDefaultTriggers = (vertical?: VerticalKey | null): FlowTrigger[] => {
  const copy = getWizardCopy(vertical);
  return [
    {
      id: "trigger-start",
      type: "KEYWORD",
      config: {
        keywords: copy.triggerKeywords.length ? copy.triggerKeywords : ["start"],
        matchType: "CONTAINS",
      },
      startNodeId: "start",
    },
  ];
};

export const defaultNodes: Node[] = buildDefaultNodes("gastro");
export const defaultEdges: Edge[] = buildDefaultEdges("gastro");
export const defaultTriggers: FlowTrigger[] = buildDefaultTriggers("gastro");

const buildDefaultMetadata = (vertical?: VerticalKey | null): FlowMetadata => {
  const requiredFields =
    vertical === "gastro" || !vertical
      ? ["name", "date", "time", "guestCount"]
      : ["name", "date", "time"];

  return {
    version: "1.0",
    output_config: {
      type: "reservation",
      requiredFields,
      defaults: requiredFields.includes("guestCount") ? undefined : { guestCount: 1 },
    },
  };
};

export const defaultMetadata: FlowMetadata = buildDefaultMetadata("gastro");

export const getDefaultFlowPreset = (vertical?: VerticalKey | null) => ({
  nodes: buildDefaultNodes(vertical),
  edges: buildDefaultEdges(vertical),
  triggers: buildDefaultTriggers(vertical),
  metadata: buildDefaultMetadata(vertical),
});
