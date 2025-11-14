import { Edge, Node } from "reactflow";

export const defaultNodes: Node[] = [
  {
    id: "start",
    position: { x: 120, y: 80 },
    type: "input",
    data: { label: "Willkommen bei Wesponde! Wie kann ich dir helfen?", variant: "message" },
  },
  {
    id: "option-reservation",
    position: { x: 380, y: 40 },
    data: { label: "Reservierung anstoßen", variant: "choice" },
  },
  {
    id: "option-faq",
    position: { x: 380, y: 140 },
    data: { label: "Fragen beantworten", variant: "choice" },
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
