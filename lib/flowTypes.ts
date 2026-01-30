export type FlowStatus = "Entwurf" | "Aktiv";

export type FlowTriggerMatchType = "EXACT" | "CONTAINS";

export type FlowTrigger = {
  id: string;
  type: "KEYWORD";
  config: {
    keywords: string[];
    matchType: FlowTriggerMatchType;
  };
  startNodeId: string | null;
};

export type FlowQuickReply = {
  id: string;
  label: string;
  payload: string;
  targetNodeId: string | null;
};

export type FlowNodeData = {
  text: string;
  imageUrl?: string | null;
  quickReplies: FlowQuickReply[];
  label?: string;
  variant?: string;
};

export type FlowMetadata = {
  version: string;
  [key: string]: unknown;
};

export type FlowExport = {
  id: string;
  name: string;
  status: FlowStatus;
  triggers: FlowTrigger[];
  nodes: any[];
  edges: any[];
  metadata: FlowMetadata;
};

// Conversation metadata for storing extracted variables
export type ConversationVariables = {
  name?: string;
  date?: string;
  time?: string;
  guestCount?: number;
  phone?: string;
  email?: string;
  specialRequests?: string;
  [key: string]: string | number | undefined;
};

export type ConversationMetadata = {
  variables?: ConversationVariables;
  reservationId?: string;
  flowCompleted?: boolean;
  [key: string]: unknown;
};
