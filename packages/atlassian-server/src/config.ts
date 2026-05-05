export interface AuthConfig {
  type: "pat" | "basic";
  pat?: string;
  username?: string;
  password?: string;
}

export interface JiraConfig {
  baseUrl: string;
  auth: AuthConfig;
  maxResults: number;
  requestTimeoutMs: number;
}

export interface ConfluenceConfig {
  baseUrl: string;
  auth: AuthConfig;
  maxResults: number;
  requestTimeoutMs: number;
}

export interface AppConfig {
  jira: JiraConfig;
  confluence: ConfluenceConfig;
}

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function validateBaseUrl(url: string, name: string): string {
  const trimmed = url.replace(/\/+$/, "");
  if (!trimmed.startsWith("https://")) {
    throw new Error(
      `${name} must use HTTPS. Got: ${trimmed}. ` +
        `Set NODE_TLS_REJECT_UNAUTHORIZED=0 for self-signed certs if needed.`
    );
  }
  return trimmed;
}

function loadAuthConfig(prefix: string): AuthConfig {
  const authType = getEnvOrDefault(`${prefix}_AUTH_TYPE`, "pat") as
    | "pat"
    | "basic";

  if (authType === "pat") {
    return {
      type: "pat",
      pat: getEnvOrThrow(`${prefix}_PAT`),
    };
  }

  return {
    type: "basic",
    username: getEnvOrThrow(`${prefix}_USERNAME`),
    password: getEnvOrThrow(`${prefix}_PASSWORD`),
  };
}

export function loadConfig(): AppConfig {
  const jiraBaseUrl = validateBaseUrl(
    getEnvOrThrow("JIRA_BASE_URL"),
    "JIRA_BASE_URL"
  );
  const confluenceBaseUrl = validateBaseUrl(
    getEnvOrThrow("CONFLUENCE_BASE_URL"),
    "CONFLUENCE_BASE_URL"
  );

  return {
    jira: {
      baseUrl: jiraBaseUrl,
      auth: loadAuthConfig("JIRA"),
      maxResults: parseInt(getEnvOrDefault("JIRA_MAX_RESULTS", "50"), 10),
      requestTimeoutMs: parseInt(
        getEnvOrDefault("JIRA_REQUEST_TIMEOUT_MS", "30000"),
        10
      ),
    },
    confluence: {
      baseUrl: confluenceBaseUrl,
      auth: loadAuthConfig("CONFLUENCE"),
      maxResults: parseInt(
        getEnvOrDefault("CONFLUENCE_MAX_RESULTS", "25"),
        10
      ),
      requestTimeoutMs: parseInt(
        getEnvOrDefault("CONFLUENCE_REQUEST_TIMEOUT_MS", "30000"),
        10
      ),
    },
  };
}
