import { describe, it, expect, vi, beforeEach } from "vitest";
import { JiraClient } from "../src/jira/client.js";
import { ConfluenceClient } from "../src/confluence/client.js";
import { fetchTool } from "../src/tools/common/fetch.js";
import type { JiraConfig, ConfluenceConfig } from "../src/config.js";

const jiraConfig: JiraConfig = {
  baseUrl: "https://jira.example.com",
  auth: { type: "pat", pat: "jira-token" },
  maxResults: 50,
  requestTimeoutMs: 30000,
};

const confluenceConfig: ConfluenceConfig = {
  baseUrl: "https://confluence.example.com",
  auth: { type: "pat", pat: "conf-token" },
  maxResults: 25,
  requestTimeoutMs: 30000,
};

describe("fetchTool - SSRF protection", () => {
  let jiraClient: JiraClient;
  let confluenceClient: ConfluenceClient;

  beforeEach(() => {
    jiraClient = new JiraClient(jiraConfig);
    confluenceClient = new ConfluenceClient(confluenceConfig);
    vi.restoreAllMocks();
  });

  it("blocks requests to arbitrary URLs", async () => {
    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: "https://evil.com/steal-data" }
    );

    expect(result).toContain("Error");
    expect(result).toContain("SSRF protection");
  });

  it("blocks requests to localhost", async () => {
    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: "http://localhost:8080/admin" }
    );

    expect(result).toContain("Error");
  });

  it("allows requests to configured Jira URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), { status: 200 })
    );

    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: "https://jira.example.com/rest/api/2/serverInfo" }
    );

    expect(result).toContain("ok");
  });

  it("allows requests to configured Confluence URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "123" }), { status: 200 })
    );

    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: "https://confluence.example.com/rest/api/content/123" }
    );

    expect(result).toContain("123");
  });
});
