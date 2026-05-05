import { z } from 'zod';
import { ConfluenceClient } from '../../confluence/client.js';
import { ConfluencePageList } from '../../confluence/types.js';

export const getConfluenceCommentChildrenSchema = z.object({
  commentId: z.string().describe('Parent comment ID'),
  maxResults: z.number().optional().describe('Max reply comments to return (default: 25)'),
});

export type GetConfluenceCommentChildrenInput = z.infer<typeof getConfluenceCommentChildrenSchema>;

export async function getConfluenceCommentChildren(
  client: ConfluenceClient,
  input: GetConfluenceCommentChildrenInput
): Promise<string> {
  const result = await client.get<ConfluencePageList>(
    `/rest/api/content/${encodeURIComponent(input.commentId)}/child/comment`,
    {
      expand: 'body.view,version',
      limit: input.maxResults ?? 25,
    }
  );

  const replies = result.results || [];
  if (replies.length === 0) {
    return `No replies found for comment ${input.commentId}`;
  }

  let output = `Replies to comment ${input.commentId} (${replies.length}):\n\n`;
  for (const reply of replies) {
    const author = reply.version?.by;
    const date = reply.version?.when;
    const body = reply.body?.view?.value || reply.body?.storage?.value || '';
    output += `[${reply.id}] ${author?.displayName ?? 'Unknown'} (${date ? date.split('T')[0] : '?'}):\n`;
    output += `  ${body.replace(/<[^>]*>/g, '').slice(0, 500)}\n\n`;
  }
  return output;
}
