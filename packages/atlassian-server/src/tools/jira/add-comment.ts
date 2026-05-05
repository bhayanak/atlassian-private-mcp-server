import { z } from "zod";
import { JiraClient } from "../../jira/client.js";

export const addCommentToJiraIssueSchema = z.object({
  issueIdOrKey: z.string().describe("Jira issue ID or key"),
  body: z
    .string()
    .describe("Comment text (plain text or Jira wiki markup)"),
  visibility: z
    .object({
      type: z.enum(["role", "group"]),
      value: z.string(),
    })
    .optional()
    .describe("Restrict comment visibility to a role or group"),
});

export type AddCommentToJiraIssueInput = z.infer<
  typeof addCommentToJiraIssueSchema
>;

export async function addCommentToJiraIssue(
  client: JiraClient,
  input: AddCommentToJiraIssueInput
): Promise<string> {
  const payload: Record<string, unknown> = { body: input.body };
  if (input.visibility) {
    payload.visibility = input.visibility;
  }

  const result = await client.post<{
    id: string;
    author: { displayName: string; name: string };
    created: string;
  }>(
    `/rest/api/2/issue/${encodeURIComponent(input.issueIdOrKey)}/comment`,
    payload
  );

  return `Comment added to ${input.issueIdOrKey}\nComment ID: ${result.id}\nAuthor: ${result.author?.displayName} (${result.author?.name})\nCreated: ${result.created}`;
}
