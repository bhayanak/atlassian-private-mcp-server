import { z } from 'zod';
import { ConfluenceClient } from '../../confluence/client.js';
import { ConfluencePage } from '../../confluence/types.js';

export const createConfluenceInlineCommentSchema = z.object({
  pageId: z.string().describe('Confluence page ID'),
  body: z.string().describe('Inline comment body text'),
  markerRef: z
    .string()
    .describe(
      "The marker reference (anchor ID) for the highlighted text. Obtained from the page's rendered storage format."
    ),
  parentCommentId: z.string().optional().describe('Parent inline comment ID for a reply'),
});

export type CreateConfluenceInlineCommentInput = z.infer<
  typeof createConfluenceInlineCommentSchema
>;

export async function createConfluenceInlineComment(
  client: ConfluenceClient,
  input: CreateConfluenceInlineCommentInput,
  baseUrl: string
): Promise<string> {
  const payload: Record<string, unknown> = {
    type: 'comment',
    container: { id: input.pageId, type: 'page' },
    body: {
      storage: {
        value: input.body,
        representation: 'storage',
      },
    },
    extensions: {
      inlineProperties: {
        markerRef: input.markerRef,
      },
    },
  };

  if (input.parentCommentId) {
    payload.ancestors = [{ id: input.parentCommentId }];
  }

  const comment = await client.post<ConfluencePage>(`/rest/api/content`, payload);

  const url = comment._links?.webui ? `${baseUrl}${comment._links.webui}` : '';
  return `Inline comment created successfully\nComment ID: ${comment.id}\nMarker: ${input.markerRef}\nURL: ${url}`;
}
