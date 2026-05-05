import { z } from 'zod';
import { JiraClient } from '../../jira/client.js';
import { JiraFieldMeta } from '../../jira/types.js';

export const getJiraIssueTypeMetaWithFieldsSchema = z.object({
  projectKeyOrId: z.string().describe("Project key or numeric ID, e.g. 'STOR' or '10000'"),
  issueTypeId: z.string().describe('Issue type ID'),
});

export type GetJiraIssueTypeMetaWithFieldsInput = z.infer<
  typeof getJiraIssueTypeMetaWithFieldsSchema
>;

export async function getJiraIssueTypeMetaWithFields(
  client: JiraClient,
  input: GetJiraIssueTypeMetaWithFieldsInput
): Promise<string> {
  let fields: Record<string, JiraFieldMeta>;

  // Try new endpoint first (Jira 8.4+), fall back to old endpoint
  const supportsNew = await client.supportsNewCreateMeta().catch(() => false);

  if (supportsNew) {
    const result = await client.get<{ values: JiraFieldMeta[] }>(
      `/rest/api/2/issue/createmeta/${encodeURIComponent(input.projectKeyOrId)}/issuetypes/${encodeURIComponent(input.issueTypeId)}`
    );
    fields = Object.fromEntries((result.values || []).map((f) => [f.key, f]));
  } else {
    // Fallback for Jira < 8.4
    const result = await client.get<{
      projects: Array<{
        issuetypes: Array<{ id: string; fields: Record<string, JiraFieldMeta> }>;
      }>;
    }>('/rest/api/2/issue/createmeta', {
      projectKeys: input.projectKeyOrId,
      issuetypeIds: input.issueTypeId,
      expand: 'projects.issuetypes.fields',
    });

    const project = result.projects?.[0];
    const issueType = project?.issuetypes?.[0];
    fields = issueType?.fields || {};
  }

  if (!fields || Object.keys(fields).length === 0) {
    return `No field metadata found for project ${input.projectKeyOrId}, issue type ${input.issueTypeId}`;
  }

  let output = `Fields for project ${input.projectKeyOrId}, issue type ${input.issueTypeId}:\n\n`;
  const requiredFields: string[] = [];
  const optionalFields: string[] = [];

  for (const [key, meta] of Object.entries(fields)) {
    const line = `  ${meta.name} (${key}) — type: ${meta.schema.type}${meta.schema.items ? `[${meta.schema.items}]` : ''}${meta.allowedValues ? ` [${meta.allowedValues.length} allowed values]` : ''}`;
    if (meta.required) {
      requiredFields.push(line);
    } else {
      optionalFields.push(line);
    }
  }

  output += `Required fields:\n${requiredFields.join('\n')}\n\n`;
  output += `Optional fields:\n${optionalFields.join('\n')}\n`;

  return output;
}
