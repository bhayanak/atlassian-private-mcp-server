import { z } from "zod";
import { JiraClient } from "../../jira/client.js";

export const createJiraIssueSchema = z.object({
  projectKey: z.string().describe("Project key, e.g. 'STOR'"),
  issueType: z
    .string()
    .describe("Issue type name or ID, e.g. 'Bug', 'Story', 'Task'"),
  summary: z.string().describe("Issue summary/title"),
  description: z
    .string()
    .optional()
    .describe("Issue description (plain text or Jira wiki markup)"),
  assignee: z.string().optional().describe("Assignee username"),
  priority: z
    .string()
    .optional()
    .describe("Priority name, e.g. 'High', 'Medium', 'Low'"),
  labels: z.array(z.string()).optional().describe("List of label strings"),
  components: z
    .array(z.string())
    .optional()
    .describe("List of component names"),
  fixVersions: z
    .array(z.string())
    .optional()
    .describe("List of fix version names"),
  parent: z
    .string()
    .optional()
    .describe("Parent issue key (for subtasks)"),
  customFields: z
    .record(z.unknown())
    .optional()
    .describe(
      "Additional custom field values as key-value pairs, e.g. { 'customfield_10001': 'value' }"
    ),
});

export type CreateJiraIssueInput = z.infer<typeof createJiraIssueSchema>;

export async function createJiraIssue(
  client: JiraClient,
  input: CreateJiraIssueInput,
  baseUrl: string
): Promise<string> {
  const fields: Record<string, unknown> = {
    project: { key: input.projectKey },
    issuetype: { name: input.issueType },
    summary: input.summary,
  };

  if (input.description) fields.description = input.description;
  if (input.assignee) fields.assignee = { name: input.assignee };
  if (input.priority) fields.priority = { name: input.priority };
  if (input.labels) fields.labels = input.labels;
  if (input.components) {
    fields.components = input.components.map((name) => ({ name }));
  }
  if (input.fixVersions) {
    fields.fixVersions = input.fixVersions.map((name) => ({ name }));
  }
  if (input.parent) {
    fields.parent = { key: input.parent };
  }
  if (input.customFields) {
    Object.assign(fields, input.customFields);
  }

  const result = await client.post<{ id: string; key: string; self: string }>(
    "/rest/api/2/issue",
    { fields }
  );

  return `Issue created successfully\nKey: ${result.key}\nID: ${result.id}\nURL: ${baseUrl}/browse/${result.key}`;
}
