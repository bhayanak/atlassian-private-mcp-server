import { z } from 'zod';
import { ConfluenceClient } from '../../confluence/client.js';
import { ConfluencePage } from '../../confluence/types.js';
import { formatConfluencePage } from '../../utils/format.js';

export const getConfluencePageSchema = z.object({
  pageId: z.string().describe('Confluence page ID (numeric)'),
  includeBody: z
    .boolean()
    .optional()
    .describe(
      'Whether to include the page body content (default: true). Set to false for metadata-only.'
    ),
});

export type GetConfluencePageInput = z.infer<typeof getConfluencePageSchema>;

export async function getConfluencePage(
  client: ConfluenceClient,
  input: GetConfluencePageInput,
  baseUrl: string
): Promise<string> {
  const expand =
    input.includeBody !== false
      ? 'body.storage,version,space,ancestors'
      : 'version,space,ancestors';

  const page = await client.get<ConfluencePage>(
    `/rest/api/content/${encodeURIComponent(input.pageId)}`,
    { expand }
  );

  return formatConfluencePage(page as unknown as Record<string, unknown>, baseUrl);
}
