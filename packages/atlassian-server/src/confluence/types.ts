export interface ConfluenceUser {
  type: "known" | "anonymous" | "unknown";
  username: string;
  displayName: string;
  userKey?: string;
  profilePicture?: { path: string; width: number; height: number };
}

export interface ConfluenceVersion {
  by: ConfluenceUser;
  when: string;
  number: number;
  message?: string;
  minorEdit: boolean;
}

export interface ConfluenceSpace {
  id: number;
  key: string;
  name: string;
  type: "global" | "personal";
  description?: {
    plain?: { value: string; representation: "plain" };
  };
  homepage?: ConfluencePage;
  _links: {
    webui: string;
    self: string;
  };
}

export interface ConfluenceBody {
  storage?: { value: string; representation: "storage" };
  view?: { value: string; representation: "view" };
  wiki?: { value: string; representation: "wiki" };
}

export interface ConfluencePage {
  id: string;
  type: "page" | "blogpost" | "comment" | "attachment";
  title: string;
  status: "current" | "draft" | "trashed";
  space?: ConfluenceSpace;
  version?: ConfluenceVersion;
  ancestors?: ConfluencePage[];
  body?: ConfluenceBody;
  children?: {
    page?: ConfluencePageList;
    comment?: ConfluencePageList;
  };
  extensions?: {
    inlineProperties?: {
      markerRef?: string;
      originalSelection?: string;
    };
  };
  metadata?: {
    labels?: {
      results: ConfluenceLabel[];
    };
  };
  _links: {
    webui: string;
    self: string;
    tinyui?: string;
  };
}

export interface ConfluencePageList {
  results: ConfluencePage[];
  start: number;
  limit: number;
  size: number;
  _links?: {
    next?: string;
  };
}

export interface ConfluenceSearchResult {
  results: ConfluencePage[];
  start: number;
  limit: number;
  size: number;
  totalSize: number;
  _links?: {
    next?: string;
  };
}

export interface ConfluenceSpaceList {
  results: ConfluenceSpace[];
  start: number;
  limit: number;
  size: number;
  _links?: {
    next?: string;
  };
}

export interface ConfluenceLabel {
  id: string;
  name: string;
  prefix: string;
}

export interface ConfluenceServerInfo {
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
  buildNumber: number;
  displayVersion: string;
}
