import { z } from 'zod';
import { JiraClient } from '../../jira/client.js';
import { JiraRemoteLink } from '../../jira/types.js';

export const getJiraIssueRemoteIssueLinksSchema = z.object({
  issueIdOrKey: z.string().describe('Jira issue ID or key'),
});

export type GetJiraIssueRemoteIssueLinksInput = z.infer<typeof getJiraIssueRemoteIssueLinksSchema>;

export async function getJiraIssueRemoteIssueLinks(
  client: JiraClient,
  input: GetJiraIssueRemoteIssueLinksInput
): Promise<string> {
  const links = await client.get<JiraRemoteLink[]>(
    `/rest/api/2/issue/${encodeURIComponent(input.issueIdOrKey)}/remotelink`
  );

  if (!links || links.length === 0) {
    return `No remote links found on issue ${input.issueIdOrKey}`;
  }

  let output = `Remote links on ${input.issueIdOrKey}:\n\n`;
  for (const link of links) {
    output += `• ${link.object.title}\n`;
    output += `  URL: ${link.object.url}\n`;
    if (link.relationship) {
      output += `  Relationship: ${link.relationship}\n`;
    }
    if (link.application?.name) {
      output += `  Application: ${link.application.name}\n`;
    }
    if (link.object.summary) {
      output += `  Summary: ${link.object.summary}\n`;
    }
    output += '\n';
  }
  return output;
}
