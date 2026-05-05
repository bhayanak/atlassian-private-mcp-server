import { z } from 'zod';
import { ConfluenceClient } from '../../confluence/client.js';
import { ConfluencePage } from '../../confluence/types.js';

export const updateConfluencePageSchema = z.object({
  pageId: z.string().describe('Confluence page ID to update'),
  title: z.string().optional().describe('New page title'),
  body: z.string().optional().describe('New page body content'),
  bodyFormat: z
    .enum(['storage', 'wiki', 'plain'])
    .optional()
    .describe("Body format (default: 'storage')"),
  versionNumber: z
    .number()
    .optional()
    .describe('Current version number. If omitted, fetched automatically and incremented.'),
  versionMessage: z.string().optional().describe('Version comment for the update'),
  status: z.enum(['current', 'draft']).optional().describe('New page status'),
});

export type UpdateConfluencePageInput = z.infer<typeof updateConfluencePageSchema>;

export async function updateConfluencePage(
  client: ConfluenceClient,
  input: UpdateConfluencePageInput,
  baseUrl: string
): Promise<string> {
  // Fetch current page to get version and title if needed
  const currentPage = await client.get<ConfluencePage>(
    `/rest/api/content/${encodeURIComponent(input.pageId)}`,
    { expand: 'version,space,body.storage' }
  );

  const currentVersion = input.versionNumber ?? currentPage.version?.number ?? 1;
  const newTitle = input.title ?? currentPage.title;

  const payload: Record<string, unknown> = {
    type: 'page',
    title: newTitle,
    status: input.status || 'current',
    version: {
      number: currentVersion + 1,
      message: input.versionMessage,
    },
  };

  if (input.body !== undefined) {
    const format = input.bodyFormat || 'storage';
    const representation = format === 'plain' ? 'storage' : format;
    const bodyValue = format === 'plain' ? `<p>${input.body}</p>` : input.body;

    payload.body = {
      [representation]: {
        value: bodyValue,
        representation,
      },
    };
  } else {
    // Preserve existing body
    payload.body = currentPage.body;
  }

  const updatedPage = await client.put<ConfluencePage>(
    `/rest/api/content/${encodeURIComponent(input.pageId)}`,
    payload
  );

  const url = updatedPage._links?.webui ? `${baseUrl}${updatedPage._links.webui}` : '';
  return `Page updated successfully\nTitle: ${updatedPage.title}\nID: ${updatedPage.id}\nVersion: ${updatedPage.version?.number ?? currentVersion + 1}\nURL: ${url}`;
}
