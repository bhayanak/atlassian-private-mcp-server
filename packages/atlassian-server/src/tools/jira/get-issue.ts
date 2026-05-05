import { z } from 'zod';
import { JiraClient } from '../../jira/client.js';
import { JiraIssue } from '../../jira/types.js';
import { formatJiraIssue } from '../../utils/format.js';

export const getJiraIssueSchema = z.object({
  issueIdOrKey: z.string().describe("Jira issue ID or key, e.g. 'PROJ-123' or '10001'"),
  expand: z
    .array(z.string())
    .optional()
    .describe(
      'Fields to expand. Options: renderedFields, names, schema, transitions, operations, editmeta, changelog, versionedRepresentations'
    ),
});

export type GetJiraIssueInput = z.infer<typeof getJiraIssueSchema>;

export async function getJiraIssue(
  client: JiraClient,
  input: GetJiraIssueInput,
  baseUrl: string
): Promise<string> {
  const expand = input.expand?.join(',') || 'renderedFields,names';
  const issue = await client.get<JiraIssue>(
    `/rest/api/2/issue/${encodeURIComponent(input.issueIdOrKey)}`,
    { expand }
  );
  return formatJiraIssue(issue as unknown as Record<string, unknown>, baseUrl);
}
