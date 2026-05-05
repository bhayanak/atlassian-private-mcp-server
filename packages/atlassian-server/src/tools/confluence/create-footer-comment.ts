import { z } from 'zod';
import { ConfluenceClient } from '../../confluence/client.js';
import { ConfluencePage } from '../../confluence/types.js';

export const createConfluenceFooterCommentSchema = z.object({
  pageId: z.string().describe('Confluence page ID to comment on'),
  body: z.string().describe('Comment body in Confluence Storage Format or wiki markup'),
  bodyFormat: z.enum(['storage', 'wiki']).optional().describe("Body format (default: 'storage')"),
  parentCommentId: z
    .string()
    .optional()
    .describe('Parent comment ID to create a reply (omit for top-level comment)'),
});

export type CreateConfluenceFooterCommentInput = z.infer<
  typeof createConfluenceFooterCommentSchema
>;

export async function createConfluenceFooterComment(
  client: ConfluenceClient,
  input: CreateConfluenceFooterCommentInput,
  baseUrl: string
): Promise<string> {
  const format = input.bodyFormat || 'storage';

  const payload: Record<string, unknown> = {
    type: 'comment',
    container: { id: input.pageId, type: 'page' },
    body: {
      [format]: {
        value: input.body,
        representation: format,
      },
    },
  };

  if (input.parentCommentId) {
    payload.ancestors = [{ id: input.parentCommentId }];
  }

  const comment = await client.post<ConfluencePage>(`/rest/api/content`, payload);

  const url = comment._links?.webui ? `${baseUrl}${comment._links.webui}` : '';
  return `Comment created successfully\nComment ID: ${comment.id}\nAuthor: ${comment.version?.by?.displayName ?? 'current user'}\nURL: ${url}`;
}
