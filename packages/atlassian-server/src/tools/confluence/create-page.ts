import { z } from "zod";
import { ConfluenceClient } from "../../confluence/client.js";
import { ConfluencePage } from "../../confluence/types.js";

export const createConfluencePageSchema = z.object({
  spaceKey: z.string().describe("Target space key"),
  title: z.string().describe("Page title"),
  body: z
    .string()
    .describe(
      "Page body content in Confluence Storage Format (XHTML) or plain text"
    ),
  bodyFormat: z
    .enum(["storage", "wiki", "plain"])
    .optional()
    .describe(
      "Body format: 'storage' (XHTML, default), 'wiki' (wiki markup), 'plain'"
    ),
  parentPageId: z
    .string()
    .optional()
    .describe("Parent page ID to create this page as a child"),
  status: z
    .enum(["current", "draft"])
    .optional()
    .describe("Page status: 'current' (published, default) or 'draft'"),
  labels: z
    .array(z.string())
    .optional()
    .describe("Labels to apply to the new page"),
});

export type CreateConfluencePageInput = z.infer<
  typeof createConfluencePageSchema
>;

export async function createConfluencePage(
  client: ConfluenceClient,
  input: CreateConfluencePageInput,
  baseUrl: string
): Promise<string> {
  const format = input.bodyFormat || "storage";
  const representation = format === "plain" ? "storage" : format;

  // For plain text, wrap in paragraph tags
  const bodyValue =
    format === "plain" ? `<p>${input.body}</p>` : input.body;

  const payload: Record<string, unknown> = {
    type: "page",
    title: input.title,
    status: input.status || "current",
    space: { key: input.spaceKey },
    body: {
      [representation]: {
        value: bodyValue,
        representation,
      },
    },
  };

  if (input.parentPageId) {
    payload.ancestors = [{ id: input.parentPageId }];
  }

  const page = await client.post<ConfluencePage>("/rest/api/content", payload);

  // Add labels if provided
  if (input.labels && input.labels.length > 0) {
    const labelPayload = input.labels.map((name) => ({
      prefix: "global",
      name,
    }));
    await client.post(
      `/rest/api/content/${page.id}/label`,
      labelPayload
    );
  }

  const url = page._links?.webui ? `${baseUrl}${page._links.webui}` : "";
  return `Page created successfully\nTitle: ${page.title}\nID: ${page.id}\nVersion: ${page.version?.number ?? 1}\nURL: ${url}`;
}
