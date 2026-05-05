import { z } from 'zod';
import { ConfluenceClient } from '../../confluence/client.js';
import { ConfluencePageList, ConfluencePage } from '../../confluence/types.js';

export const getConfluencePageInlineCommentsSchema = z.object({
  pageId: z.string().describe('Confluence page ID'),
  maxResults: z.number().optional().describe('Max inline comments to return (default: 25)'),
});

export type GetConfluencePageInlineCommentsInput = z.infer<
  typeof getConfluencePageInlineCommentsSchema
>;

export async function getConfluencePageInlineComments(
  client: ConfluenceClient,
  input: GetConfluencePageInlineCommentsInput
): Promise<string> {
  const result = await client.get<ConfluencePageList>(
    `/rest/api/content/${encodeURIComponent(input.pageId)}/child/comment`,
    {
      expand: 'body.view,version,extensions.inlineProperties',
      limit: input.maxResults ?? 25,
      depth: 'all',
    }
  );

  // Filter to only inline comments (those with inlineProperties)
  const inlineComments = (result.results || []).filter(
    (c: ConfluencePage) => c.extensions?.inlineProperties
  );

  if (inlineComments.length === 0) {
    return `No inline comments found on page ${input.pageId}`;
  }

  let output = `Inline comments on page ${input.pageId} (${inlineComments.length}):\n\n`;
  for (const comment of inlineComments) {
    const author = comment.version?.by;
    const date = comment.version?.when;
    const body = comment.body?.view?.value || comment.body?.storage?.value || '';
    const selection = comment.extensions?.inlineProperties?.originalSelection;

    output += `[${comment.id}] ${author?.displayName ?? 'Unknown'} (${date ? date.split('T')[0] : '?'}):\n`;
    if (selection) {
      output += `  Anchored to: "${selection}"\n`;
    }
    output += `  ${body.replace(/<[^>]*>/g, '').slice(0, 500)}\n\n`;
  }
  return output;
}
