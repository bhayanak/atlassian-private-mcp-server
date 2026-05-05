import { z } from "zod";
import { JiraClient } from "../../jira/client.js";

export const transitionJiraIssueSchema = z.object({
  issueIdOrKey: z.string().describe("Jira issue ID or key"),
  transitionId: z
    .string()
    .describe("Transition ID from getTransitionsForJiraIssue"),
  comment: z
    .string()
    .optional()
    .describe("Optional comment to post during the transition"),
  resolution: z
    .string()
    .optional()
    .describe(
      "Resolution name to set when transitioning to a resolved state, e.g. 'Fixed', 'Won't Fix'"
    ),
});

export type TransitionJiraIssueInput = z.infer<
  typeof transitionJiraIssueSchema
>;

export async function transitionJiraIssue(
  client: JiraClient,
  input: TransitionJiraIssueInput
): Promise<string> {
  const payload: Record<string, unknown> = {
    transition: { id: input.transitionId },
  };

  if (input.resolution) {
    payload.fields = { resolution: { name: input.resolution } };
  }

  if (input.comment) {
    payload.update = {
      comment: [{ add: { body: input.comment } }],
    };
  }

  await client.post(
    `/rest/api/2/issue/${encodeURIComponent(input.issueIdOrKey)}/transitions`,
    payload
  );

  return `Issue ${input.issueIdOrKey} transitioned successfully (transition ID: ${input.transitionId}).`;
}
