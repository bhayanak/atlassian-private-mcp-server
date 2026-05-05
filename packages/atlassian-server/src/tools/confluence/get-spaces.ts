import { z } from 'zod';
import { ConfluenceClient } from '../../confluence/client.js';
import { ConfluenceSpaceList } from '../../confluence/types.js';

export const getConfluenceSpacesSchema = z.object({
  type: z
    .enum(['global', 'personal', 'all'])
    .optional()
    .describe("Space type filter (default: 'global')"),
  maxResults: z.number().optional().describe('Max spaces to return (default: 25)'),
  startAt: z.number().optional().describe('Pagination start (default: 0)'),
});

export type GetConfluenceSpacesInput = z.infer<typeof getConfluenceSpacesSchema>;

export async function getConfluenceSpaces(
  client: ConfluenceClient,
  input: GetConfluenceSpacesInput,
  baseUrl: string
): Promise<string> {
  const params: Record<string, string | number | undefined> = {
    expand: 'description.plain,homepage',
    limit: input.maxResults ?? 25,
    start: input.startAt ?? 0,
  };

  if (input.type && input.type !== 'all') {
    params.type = input.type;
  }

  const result = await client.get<ConfluenceSpaceList>('/rest/api/space', params);

  const spaces = result.results || [];
  if (spaces.length === 0) {
    return 'No spaces found.';
  }

  let output = `Confluence spaces (${spaces.length}):\n\n`;
  for (const space of spaces) {
    output += `• ${space.key} — ${space.name} [${space.type}]\n`;
    if (space.description?.plain?.value) {
      output += `  ${space.description.plain.value.slice(0, 100)}\n`;
    }
    if (space._links?.webui) {
      output += `  URL: ${baseUrl}${space._links.webui}\n`;
    }
  }
  return output;
}
