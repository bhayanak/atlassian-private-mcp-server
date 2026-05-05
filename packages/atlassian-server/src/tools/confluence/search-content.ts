import { z } from 'zod';
import { ConfluenceClient } from '../../confluence/client.js';
import { ConfluenceSearchResult } from '../../confluence/types.js';
import { formatConfluenceSearchResults } from '../../utils/format.js';

export const searchConfluenceUsingCqlSchema = z.object({
  cql: z
    .string()
    .describe(
      "CQL (Confluence Query Language) query string. Examples: 'space = NIMBLE AND type = page', 'title ~ \"storage\"', 'label = \"release-notes\" AND space in (STOR, NIMBLE)'"
    ),
  maxResults: z.number().optional().describe('Max results to return (default: 25, max: 50)'),
  startAt: z.number().optional().describe('Pagination start offset (default: 0)'),
  expand: z
    .array(z.string())
    .optional()
    .describe("Properties to expand on results, e.g. ['version', 'space', 'body.view']"),
});

export type SearchConfluenceUsingCqlInput = z.infer<typeof searchConfluenceUsingCqlSchema>;

export async function searchConfluenceUsingCql(
  client: ConfluenceClient,
  input: SearchConfluenceUsingCqlInput,
  baseUrl: string,
  defaultMaxResults: number
): Promise<string> {
  const maxResults = Math.min(input.maxResults ?? defaultMaxResults, 50);
  const expand = input.expand?.join(',') || 'version,space,metadata.labels';

  const result = await client.get<ConfluenceSearchResult>('/rest/api/content/search', {
    cql: input.cql,
    limit: maxResults,
    start: input.startAt ?? 0,
    expand,
  });

  const header = `CQL: ${input.cql}\n`;
  return (
    header + formatConfluenceSearchResults(result as unknown as Record<string, unknown>, baseUrl)
  );
}
