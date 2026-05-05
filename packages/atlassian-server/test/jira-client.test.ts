import { describe, it, expect, vi, beforeEach } from "vitest";
import { JiraClient } from "../src/jira/client.js";
import type { JiraConfig } from "../src/config.js";

const mockConfig: JiraConfig = {
  baseUrl: "https://jira.example.com",
  auth: { type: "pat", pat: "test-token" },
  maxResults: 50,
  requestTimeoutMs: 30000,
};

describe("JiraClient", () => {
  let client: JiraClient;

  beforeEach(() => {
    client = new JiraClient(mockConfig);
    vi.restoreAllMocks();
  });

  describe("get()", () => {
    it("makes GET request with correct auth header and base URL", async () => {
      const mockResponse = { key: "TEST-1", fields: {} };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const result = await client.get<typeof mockResponse>("/rest/api/2/issue/TEST-1");

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        "https://jira.example.com/rest/api/2/issue/TEST-1",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            Accept: "application/json",
          }),
        })
      );
    });

    it("appends query params correctly", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("{}", { status: 200 })
      );

      await client.get("/rest/api/2/search", { jql: "project=TEST", maxResults: 10 });

      const calledUrl = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(calledUrl).toContain("jql=project%3DTEST");
      expect(calledUrl).toContain("maxResults=10");
    });

    it("throws JiraApiError on non-2xx response", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response('{"errorMessages":["Issue not found"]}', {
          status: 404,
          statusText: "Not Found",
        })
      );

      await expect(client.get("/rest/api/2/issue/NOPE-1")).rejects.toThrow(
        "Jira API error 404 Not Found"
      );
    });
  });

  describe("post()", () => {
    it("sends POST with JSON body and CSRF header", async () => {
      const responseBody = { id: "12345", key: "TEST-2" };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(responseBody), { status: 201 })
      );

      const result = await client.post<typeof responseBody>("/rest/api/2/issue", {
        fields: { project: { key: "TEST" } },
      });

      expect(result).toEqual(responseBody);
      expect(fetch).toHaveBeenCalledWith(
        "https://jira.example.com/rest/api/2/issue",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "X-Atlassian-Token": "no-check",
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("supportsNewCreateMeta()", () => {
    it("returns true for Jira 8.4+", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            version: "8.20.0",
            versionNumbers: [8, 20, 0],
            buildNumber: 820000,
          }),
          { status: 200 }
        )
      );

      const result = await client.supportsNewCreateMeta();
      expect(result).toBe(true);
    });

    it("returns false for Jira 7.x", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            version: "7.13.0",
            versionNumbers: [7, 13, 0],
            buildNumber: 713000,
          }),
          { status: 200 }
        )
      );

      const result = await client.supportsNewCreateMeta();
      expect(result).toBe(false);
    });

    it("returns false for Jira 8.3", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            version: "8.3.4",
            versionNumbers: [8, 3, 4],
            buildNumber: 803004,
          }),
          { status: 200 }
        )
      );

      const result = await client.supportsNewCreateMeta();
      expect(result).toBe(false);
    });

    it("returns true for Jira 9.x", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            version: "9.4.0",
            versionNumbers: [9, 4, 0],
            buildNumber: 940000,
          }),
          { status: 200 }
        )
      );

      const result = await client.supportsNewCreateMeta();
      expect(result).toBe(true);
    });
  });
});
