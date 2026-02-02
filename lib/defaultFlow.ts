import { Edge, Node } from "reactflow";
import type { FlowTrigger, FlowMetadata, FlowQuickReply } from "./flowTypes";

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

export const defaultNodes: Node[] = [
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
        makeQuickReply("qr-reservieren", "Reservieren", "option-reservation"),
        makeQuickReply("qr-fragen", "Fragen", "option-faq"),
      ],
    },
  },
  {
    id: "option-reservation",
    position: { x: 380, y: 40 },
    type: "wesponde",
    data: {
      label: "Reservierung anstoßen",
      text: "Reservierung anstoßen",
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

export const defaultEdges: Edge[] = [
  {
    id: "e-start-res",
    source: "start",
    target: "option-reservation",
    data: { tone: "positive", condition: "Reservieren" },
    label: "Reservieren",
  },
  {
    id: "e-start-faq",
    source: "start",
    target: "option-faq",
    data: { tone: "neutral", condition: "Fragen" },
    label: "Fragen",
  },
];

export const defaultTriggers: FlowTrigger[] = [
  {
    id: "trigger-start",
    type: "KEYWORD",
    config: {
      keywords: ["reservieren", "tisch", "start"],
      matchType: "CONTAINS",
    },
    startNodeId: "start",
  },
];

export const defaultMetadata: FlowMetadata = {
  version: "1.0",
};
