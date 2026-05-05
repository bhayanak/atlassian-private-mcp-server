import { z } from "zod";
import { JiraClient } from "../../jira/client.js";
import { JiraUser } from "../../jira/types.js";

export const lookupJiraAccountIdSchema = z.object({
  query: z
    .string()
    .describe("Name, display name, or email fragment to search for"),
  maxResults: z
    .number()
    .optional()
    .describe("Max users to return (default: 10)"),
});

export type LookupJiraAccountIdInput = z.infer<
  typeof lookupJiraAccountIdSchema
>;

export async function lookupJiraAccountId(
  client: JiraClient,
  input: LookupJiraAccountIdInput
): Promise<string> {
  // Try user/picker endpoint first (works across all versions)
  // Falls back to user/search for older Jira versions
  let users: JiraUser[];
  try {
    const result = await client.get<{ users: Array<{ name: string; displayName: string; html?: string }> }>(
      "/rest/api/2/user/picker",
      { query: input.query, maxResults: input.maxResults || 10 }
    );
    users = (result.users || []).map((u) => ({
      key: u.name,
      name: u.name,
      displayName: u.displayName,
      emailAddress: "",
      active: true,
    }));
  } catch {
    // Fallback to user/search (Jira 7.x+)
    users = await client.get<JiraUser[]>("/rest/api/2/user/search", {
      username: input.query,
      maxResults: input.maxResults || 10,
    });
  }

  if (!users || users.length === 0) {
    return `No users found matching "${input.query}"`;
  }

  let output = `Users matching "${input.query}":\n\n`;
  for (const u of users) {
    output += `• ${u.displayName} (username: ${u.name})`;
    if (u.emailAddress) {
      output += ` — ${u.emailAddress}`;
    }
    if (!u.active) {
      output += " [INACTIVE]";
    }
    output += "\n";
  }
  return output;
}
