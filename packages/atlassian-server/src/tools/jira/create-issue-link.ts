import { z } from 'zod';
import { JiraClient } from '../../jira/client.js';

export const createIssueLinkSchema = z.object({
  linkType: z
    .string()
    .describe("Issue link type name, e.g. 'Blocks', 'Cloners', 'Duplicate', 'Relates'"),
  inwardIssueKey: z.string().describe('Key of the inward issue'),
  outwardIssueKey: z.string().describe('Key of the outward issue'),
  comment: z.string().optional().describe('Optional comment to add when creating the link'),
});

export type CreateIssueLinkInput = z.infer<typeof createIssueLinkSchema>;

export async function createIssueLink(
  client: JiraClient,
  input: CreateIssueLinkInput
): Promise<string> {
  const payload: Record<string, unknown> = {
    type: { name: input.linkType },
    inwardIssue: { key: input.inwardIssueKey },
    outwardIssue: { key: input.outwardIssueKey },
  };

  if (input.comment) {
    payload.comment = { body: input.comment };
  }

  await client.post('/rest/api/2/issueLink', payload);

  return `Issue link created: ${input.inwardIssueKey} ←[${input.linkType}]→ ${input.outwardIssueKey}`;
}
