import { z } from "zod";
import { JiraClient } from "../../jira/client.js";

export const addWorklogToJiraIssueSchema = z.object({
  issueIdOrKey: z.string().describe("Jira issue ID or key"),
  timeSpent: z
    .string()
    .describe("Time spent in Jira duration format, e.g. '2h 30m', '1d'"),
  comment: z.string().optional().describe("Optional worklog comment"),
  started: z
    .string()
    .optional()
    .describe(
      "Start datetime in ISO 8601 format. Defaults to current time. e.g. '2026-05-05T10:00:00.000+0000'"
    ),
});

export type AddWorklogToJiraIssueInput = z.infer<
  typeof addWorklogToJiraIssueSchema
>;

export async function addWorklogToJiraIssue(
  client: JiraClient,
  input: AddWorklogToJiraIssueInput
): Promise<string> {
  const payload: Record<string, unknown> = {
    timeSpent: input.timeSpent,
  };
  if (input.comment) payload.comment = input.comment;
  if (input.started) payload.started = input.started;

  const result = await client.post<{
    id: string;
    timeSpent: string;
    timeSpentSeconds: number;
    author: { displayName: string };
  }>(
    `/rest/api/2/issue/${encodeURIComponent(input.issueIdOrKey)}/worklog`,
    payload
  );

  return `Worklog added to ${input.issueIdOrKey}\nWorklog ID: ${result.id}\nTime Spent: ${result.timeSpent} (${result.timeSpentSeconds}s)\nAuthor: ${result.author?.displayName}`;
}
