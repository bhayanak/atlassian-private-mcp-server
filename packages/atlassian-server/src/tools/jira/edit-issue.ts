import { z } from 'zod';
import { JiraClient } from '../../jira/client.js';

export const editJiraIssueSchema = z.object({
  issueIdOrKey: z.string().describe('Jira issue ID or key'),
  summary: z.string().optional().describe('New issue summary'),
  description: z.string().optional().describe('New issue description'),
  assignee: z.string().optional().describe('New assignee username (empty string to unassign)'),
  priority: z.string().optional().describe('New priority name'),
  labels: z.array(z.string()).optional().describe('Replace labels with this list'),
  components: z.array(z.string()).optional().describe('Replace components with this list'),
  fixVersions: z.array(z.string()).optional().describe('Replace fix versions with this list'),
  customFields: z
    .record(z.unknown())
    .optional()
    .describe('Additional custom field updates as key-value pairs'),
});

export type EditJiraIssueInput = z.infer<typeof editJiraIssueSchema>;

export async function editJiraIssue(
  client: JiraClient,
  input: EditJiraIssueInput
): Promise<string> {
  const fields: Record<string, unknown> = {};

  if (input.summary !== undefined) fields.summary = input.summary;
  if (input.description !== undefined) fields.description = input.description;
  if (input.assignee !== undefined) {
    fields.assignee = input.assignee === '' ? null : { name: input.assignee };
  }
  if (input.priority !== undefined) fields.priority = { name: input.priority };
  if (input.labels !== undefined) fields.labels = input.labels;
  if (input.components !== undefined) {
    fields.components = input.components.map((name) => ({ name }));
  }
  if (input.fixVersions !== undefined) {
    fields.fixVersions = input.fixVersions.map((name) => ({ name }));
  }
  if (input.customFields) {
    Object.assign(fields, input.customFields);
  }

  await client.put(`/rest/api/2/issue/${encodeURIComponent(input.issueIdOrKey)}`, { fields });

  return `Issue ${input.issueIdOrKey} updated successfully.`;
}
