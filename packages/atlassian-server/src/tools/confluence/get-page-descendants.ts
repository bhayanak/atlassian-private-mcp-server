import { z } from "zod";
import { ConfluenceClient } from "../../confluence/client.js";
import { ConfluencePageList } from "../../confluence/types.js";

export const getConfluencePageDescendantsSchema = z.object({
  pageId: z.string().describe("Parent page ID"),
  depth: z
    .enum(["all", "1"])
    .optional()
    .describe("'1' for direct children only (default), 'all' for full subtree"),
  maxResults: z
    .number()
    .optional()
    .describe("Max pages to return per level (default: 25)"),
});

export type GetConfluencePageDescendantsInput = z.infer<
  typeof getConfluencePageDescendantsSchema
>;

export async function getConfluencePageDescendants(
  client: ConfluenceClient,
  input: GetConfluencePageDescendantsInput,
  baseUrl: string
): Promise<string> {
  const endpoint = input.depth === "all"
    ? `/rest/api/content/${encodeURIComponent(input.pageId)}/descendant/page`
    : `/rest/api/content/${encodeURIComponent(input.pageId)}/child/page`;

  const result = await client.get<ConfluencePageList>(endpoint, {
    expand: "version",
    limit: input.maxResults ?? 25,
  });

  const pages = result.results || [];
  if (pages.length === 0) {
    return `No descendant pages found under page ${input.pageId}`;
  }

  let output = `Descendant pages of ${input.pageId} (${pages.length} found):\n\n`;
  for (const page of pages) {
    output += `• ${page.title} (ID: ${page.id})`;
    if (page.version) {
      output += ` — v${page.version.number}`;
    }
    if (page._links?.webui) {
      output += `\n  URL: ${baseUrl}${page._links.webui}`;
    }
    output += "\n";
  }
  return output;
}
