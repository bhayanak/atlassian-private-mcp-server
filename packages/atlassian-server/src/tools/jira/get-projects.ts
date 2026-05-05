import { z } from "zod";
import { JiraClient } from "../../jira/client.js";
import { JiraProject } from "../../jira/types.js";

export const getVisibleJiraProjectsSchema = z.object({
  maxResults: z
    .number()
    .optional()
    .describe("Maximum number of projects to return (default: 50)"),
  startAt: z.number().optional().describe("Pagination offset (default: 0)"),
  type: z
    .enum(["software", "business", "service_desk"])
    .optional()
    .describe("Filter by project type"),
});

export type GetVisibleJiraProjectsInput = z.infer<
  typeof getVisibleJiraProjectsSchema
>;

export async function getVisibleJiraProjects(
  client: JiraClient,
  input: GetVisibleJiraProjectsInput
): Promise<string> {
  const params: Record<string, string | number | undefined> = {
    expand: "description,lead",
    maxResults: input.maxResults,
    startAt: input.startAt,
  };
  if (input.type) {
    params.typeKey = input.type;
  }

  const projects = await client.get<JiraProject[]>(
    "/rest/api/2/project",
    params
  );

  if (!projects || projects.length === 0) {
    return "No projects found.";
  }

  let output = `Visible projects (${projects.length}):\n\n`;
  for (const p of projects) {
    output += `• ${p.key} — ${p.name}`;
    if (p.projectTypeKey) {
      output += ` [${p.projectTypeKey}]`;
    }
    if (p.lead) {
      output += ` | Lead: ${p.lead.displayName} (${p.lead.name})`;
    }
    output += "\n";
    if (p.description) {
      output += `  ${p.description.slice(0, 100)}\n`;
    }
  }
  return output;
}
