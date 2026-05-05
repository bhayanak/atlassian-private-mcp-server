export interface JiraUser {
  key: string;
  name: string;
  displayName: string;
  emailAddress: string;
  active: boolean;
  avatarUrls?: Record<string, string>;
  timeZone?: string;
}

export interface JiraStatus {
  id: string;
  name: string;
  statusCategory: {
    id: number;
    key: string;
    name: string;
    colorName: string;
  };
}

export interface JiraPriority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  subtask: boolean;
  iconUrl?: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey?: string;
  lead?: JiraUser;
  description?: string;
  url?: string;
  avatarUrls?: Record<string, string>;
}

export interface JiraComponent {
  id: string;
  name: string;
  description?: string;
  lead?: JiraUser;
}

export interface JiraVersion {
  id: string;
  name: string;
  description?: string;
  released?: boolean;
  releaseDate?: string;
}

export interface JiraComment {
  id: string;
  author: JiraUser;
  body: string;
  created: string;
  updated: string;
  visibility?: {
    type: "role" | "group";
    value: string;
  };
}

export interface JiraCommentList {
  comments: JiraComment[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface JiraIssueFields {
  summary: string;
  description: string | null;
  status: JiraStatus;
  assignee: JiraUser | null;
  reporter: JiraUser | null;
  priority: JiraPriority | null;
  issuetype: JiraIssueType;
  project: JiraProject;
  labels: string[];
  components: JiraComponent[];
  fixVersions: JiraVersion[];
  created: string;
  updated: string;
  comment?: JiraCommentList;
  resolution?: { name: string } | null;
  [customField: string]: unknown;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
}

export interface JiraSearchResult {
  total: number;
  startAt: number;
  maxResults: number;
  issues: JiraIssue[];
}

export interface JiraTransition {
  id: string;
  name: string;
  to: JiraStatus;
  hasScreen: boolean;
  fields?: Record<string, unknown>;
}

export interface JiraRemoteLink {
  id: number;
  self: string;
  globalId?: string;
  application?: {
    type?: string;
    name?: string;
  };
  relationship?: string;
  object: {
    url: string;
    title: string;
    summary?: string;
    icon?: { url16x16?: string; title?: string };
  };
}

export interface JiraIssueLinkType {
  id: string;
  name: string;
  inward: string;
  outward: string;
}

export interface JiraWorklog {
  id: string;
  author: JiraUser;
  timeSpent: string;
  timeSpentSeconds: number;
  comment?: string;
  started: string;
  created: string;
  updated: string;
}

export interface JiraCreateMetaIssueType {
  id: string;
  name: string;
  description?: string;
  subtask: boolean;
  fields?: Record<string, JiraFieldMeta>;
}

export interface JiraFieldMeta {
  required: boolean;
  name: string;
  key: string;
  schema: {
    type: string;
    system?: string;
    items?: string;
    custom?: string;
    customId?: number;
  };
  allowedValues?: unknown[];
  hasDefaultValue?: boolean;
  defaultValue?: unknown;
}

export interface JiraServerInfo {
  baseUrl: string;
  version: string;
  versionNumbers: number[];
  buildNumber: number;
  buildDate: string;
  serverTitle: string;
}
