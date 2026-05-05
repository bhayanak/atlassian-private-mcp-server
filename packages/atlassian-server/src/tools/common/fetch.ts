import { z } from "zod";
import { JiraClient } from "../../jira/client.js";
import { ConfluenceClient } from "../../confluence/client.js";

export const fetchSchema = z.object({
  url: z
    .string()
    .describe(
      "Absolute URL to fetch. Must begin with JIRA_BASE_URL or CONFLUENCE_BASE_URL"
    ),
  method: z
    .enum(["GET", "POST", "PUT", "DELETE"])
    .optional()
    .describe("HTTP method (default: 'GET')"),
  body: z
    .string()
    .optional()
    .describe("Request body as JSON string (for POST/PUT)"),
  headers: z
    .record(z.string())
    .optional()
    .describe(
      "Additional request headers (Authorization is injected automatically)"
    ),
});

export type FetchInput = z.infer<typeof fetchSchema>;

export async function fetchTool(
  jiraClient: JiraClient,
  confluenceClient: ConfluenceClient,
  jiraBaseUrl: string,
  confluenceBaseUrl: string,
  input: FetchInput
): Promise<string> {
  // SSRF protection: validate URL starts with configured base URLs
  const isJiraUrl = input.url.startsWith(jiraBaseUrl);
  const isConfluenceUrl = input.url.startsWith(confluenceBaseUrl);

  if (!isJiraUrl && !isConfluenceUrl) {
    return `Error: URL must begin with "${jiraBaseUrl}" or "${confluenceBaseUrl}". Refusing to fetch arbitrary URLs for SSRF protection.`;
  }

  const method = input.method || "GET";

  // Determine which client to use based on URL prefix
  if (isJiraUrl) {
    const path = input.url.slice(jiraBaseUrl.length);
    switch (method) {
      case "GET":
        const getResult = await jiraClient.get<unknown>(path);
        return JSON.stringify(getResult, null, 2);
      case "POST":
        const postResult = await jiraClient.post<unknown>(
          path,
          input.body ? JSON.parse(input.body) : {}
        );
        return JSON.stringify(postResult, null, 2);
      case "PUT":
        const putResult = await jiraClient.put<unknown>(
          path,
          input.body ? JSON.parse(input.body) : {}
        );
        return JSON.stringify(putResult, null, 2);
      case "DELETE":
        await jiraClient.delete(path);
        return "DELETE successful (204 No Content)";
    }
  } else {
    const path = input.url.slice(confluenceBaseUrl.length);
    switch (method) {
      case "GET":
        const getResult = await confluenceClient.get<unknown>(path);
        return JSON.stringify(getResult, null, 2);
      case "POST":
        const postResult = await confluenceClient.post<unknown>(
          path,
          input.body ? JSON.parse(input.body) : {}
        );
        return JSON.stringify(postResult, null, 2);
      case "PUT":
        const putResult = await confluenceClient.put<unknown>(
          path,
          input.body ? JSON.parse(input.body) : {}
        );
        return JSON.stringify(putResult, null, 2);
      case "DELETE":
        await confluenceClient.delete(path);
        return "DELETE successful (204 No Content)";
    }
  }

  return "Unknown method";
}
