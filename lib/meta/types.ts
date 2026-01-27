// Centralized Meta/Instagram types and constants

export const META_GRAPH_VERSION = "v21.0";
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export const META_PERMISSIONS = [
  "instagram_basic",
  "instagram_manage_messages",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "business_management",
] as const;

export type MetaTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type MetaLongLivedTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type MetaPageData = {
  id: string;
  name: string;
  access_token: string;
};

export type MetaAccountsResponse = {
  data: MetaPageData[];
};

export type MetaInstagramBusinessAccountResponse = {
  instagram_business_account?: {
    id: string;
  };
};

export type MetaInstagramUserResponse = {
  id: string;
  name?: string;
  username?: string;
};

export type IntegrationStatus = {
  provider: string;
  status: string;
  account_name: string | null;
  instagram_id: string | null;
  instagram_username: string | null;
  page_id: string | null;
  expires_at: string | null;
  updated_at: string | null;
};
