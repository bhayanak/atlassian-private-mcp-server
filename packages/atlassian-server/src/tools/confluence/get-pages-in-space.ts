import { z } from "zod";
import { ConfluenceClient } from "../../confluence/client.js";
import { ConfluencePageList } from "../../confluence/types.js";

export const getPagesInConfluenceSpaceSchema = z.object({
  spaceKey: z
    .string()
    .describe("Confluence space key, e.g. 'NIMBLE', 'STOR'"),
  maxResults: z
    .number()
    .optional()
    .describe("Max pages to return (default: 25)"),
  startAt: z.number().optional().describe("Pagination offset (default: 0)"),
  title: z
    .string()
    .optional()
    .describe("Optional title filter (partial match)"),
});

export type GetPagesInConfluenceSpaceInput = z.infer<
  typeof getPagesInConfluenceSpaceSchema
>;

export async function getPagesInConfluenceSpace(
  client: ConfluenceClient,
  input: GetPagesInConfluenceSpaceInput,
  baseUrl: string
): Promise<string> {
  const params: Record<string, string | number | undefined> = {
    type: "page",
    spaceKey: input.spaceKey,
    expand: "version,space,ancestors",
    limit: input.maxResults ?? 25,
    start: input.startAt ?? 0,
  };

  if (input.title) {
    params.title = input.title;
  }

  const result = await client.get<ConfluencePageList>(
    "/rest/api/content",
    params
  );

  const pages = result.results || [];
  if (pages.length === 0) {
    return `No pages found in space ${input.spaceKey}${input.title ? ` matching "${input.title}"` : ""}`;
  }

  let output = `Pages in space ${input.spaceKey} (${pages.length}):\n\n`;
  for (const page of pages) {
    const version = page.version;
    output += `• ${page.title} (ID: ${page.id})`;
    if (version) {
      output += ` — v${version.number} by ${version.by?.displayName ?? "?"}`;
      if (version.when) {
        output += ` (${version.when.split("T")[0]})`;
      }
    }
    if (page._links?.webui) {
      output += `\n  URL: ${baseUrl}${page._links.webui}`;
    }
    output += "\n";
  }
  return output;
}
