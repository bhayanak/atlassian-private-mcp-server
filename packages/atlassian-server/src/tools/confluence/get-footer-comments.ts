import { z } from "zod";
import { ConfluenceClient } from "../../confluence/client.js";
import { ConfluencePageList, ConfluencePage } from "../../confluence/types.js";

export const getConfluencePageFooterCommentsSchema = z.object({
  pageId: z.string().describe("Confluence page ID"),
  maxResults: z
    .number()
    .optional()
    .describe("Max comments to return (default: 25)"),
});

export type GetConfluencePageFooterCommentsInput = z.infer<
  typeof getConfluencePageFooterCommentsSchema
>;

export async function getConfluencePageFooterComments(
  client: ConfluenceClient,
  input: GetConfluencePageFooterCommentsInput
): Promise<string> {
  const result = await client.get<ConfluencePageList>(
    `/rest/api/content/${encodeURIComponent(input.pageId)}/child/comment`,
    {
      expand: "body.view,version",
      limit: input.maxResults ?? 25,
      depth: "all",
    }
  );

  const comments = (result.results || []).filter(
    (c: ConfluencePage) => !c.extensions?.inlineProperties
  );

  if (comments.length === 0) {
    return `No footer comments found on page ${input.pageId}`;
  }

  let output = `Footer comments on page ${input.pageId} (${comments.length}):\n\n`;
  for (const comment of comments) {
    const author = comment.version?.by;
    const date = comment.version?.when;
    const body = comment.body?.view?.value || comment.body?.storage?.value || "";
    output += `[${comment.id}] ${author?.displayName ?? "Unknown"} (${date ? date.split("T")[0] : "?"}):\n`;
    output += `  ${body.replace(/<[^>]*>/g, "").slice(0, 500)}\n\n`;
  }
  return output;
}
