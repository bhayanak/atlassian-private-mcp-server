import { z } from "zod";
import { JiraClient } from "../../jira/client.js";
import { JiraTransition } from "../../jira/types.js";

export const getTransitionsForJiraIssueSchema = z.object({
  issueIdOrKey: z.string().describe("Jira issue ID or key"),
});

export type GetTransitionsForJiraIssueInput = z.infer<
  typeof getTransitionsForJiraIssueSchema
>;

export async function getTransitionsForJiraIssue(
  client: JiraClient,
  input: GetTransitionsForJiraIssueInput
): Promise<string> {
  const result = await client.get<{ transitions: JiraTransition[] }>(
    `/rest/api/2/issue/${encodeURIComponent(input.issueIdOrKey)}/transitions`
  );

  const transitions = result.transitions || [];
  if (transitions.length === 0) {
    return `No transitions available for issue ${input.issueIdOrKey}`;
  }

  let output = `Available transitions for ${input.issueIdOrKey}:\n\n`;
  for (const t of transitions) {
    output += `• ${t.name} (ID: ${t.id}) → ${t.to.name}`;
    if (t.hasScreen) {
      output += " [has screen]";
    }
    output += "\n";
  }
  return output;
}
