import { z } from 'zod';
import { JiraClient } from '../../jira/client.js';
import { JiraCreateMetaIssueType } from '../../jira/types.js';

export const getJiraProjectIssueTypesMetadataSchema = z.object({
  projectKeyOrId: z.string().describe("Project key or numeric ID, e.g. 'STOR' or '10000'"),
});

export type GetJiraProjectIssueTypesMetadataInput = z.infer<
  typeof getJiraProjectIssueTypesMetadataSchema
>;

export async function getJiraProjectIssueTypesMetadata(
  client: JiraClient,
  input: GetJiraProjectIssueTypesMetadataInput
): Promise<string> {
  let issueTypes: JiraCreateMetaIssueType[];

  const supportsNew = await client.supportsNewCreateMeta().catch(() => false);

  if (supportsNew) {
    const result = await client.get<{ values: JiraCreateMetaIssueType[] }>(
      `/rest/api/2/issue/createmeta/${encodeURIComponent(input.projectKeyOrId)}/issuetypes`
    );
    issueTypes = result.values || [];
  } else {
    // Fallback for Jira < 8.4
    const result = await client.get<{
      projects: Array<{ issuetypes: JiraCreateMetaIssueType[] }>;
    }>('/rest/api/2/issue/createmeta', {
      projectKeys: input.projectKeyOrId,
      expand: 'projects.issuetypes',
    });
    issueTypes = result.projects?.[0]?.issuetypes || [];
  }

  if (issueTypes.length === 0) {
    return `No issue types found for project ${input.projectKeyOrId}`;
  }

  let output = `Issue types for project ${input.projectKeyOrId}:\n\n`;
  for (const it of issueTypes) {
    output += `• ${it.name} (ID: ${it.id})${it.subtask ? ' [Subtask]' : ''}\n`;
    if (it.description) {
      output += `  ${it.description}\n`;
    }
  }
  return output;
}
