import { z } from 'zod';
import { JiraClient } from '../../jira/client.js';
import { ConfluenceClient } from '../../confluence/client.js';

export const fetchSchema = z.object({
  url: z
    .string()
    .describe('Absolute URL to fetch. Must begin with JIRA_BASE_URL or CONFLUENCE_BASE_URL'),
  method: z
    .enum(['GET', 'POST', 'PUT', 'DELETE'])
    .optional()
    .describe("HTTP method (default: 'GET')"),
  body: z.string().optional().describe('Request body as JSON string (for POST/PUT)'),
  headers: z
    .record(z.string())
    .optional()
    .describe('Additional request headers (Authorization is injected automatically)'),
});

export type FetchInput = z.infer<typeof fetchSchema>;

type TextContent = { type: 'text'; text: string };
type ImageContent = { type: 'image'; data: string; mimeType: string };
export type FetchContent = TextContent | ImageContent;

const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
]);

function extractMimeType(contentType: string): string {
  return (contentType.split(';')[0] ?? '').trim().toLowerCase();
}

function isImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return IMAGE_MIME_TYPES.has(extractMimeType(contentType));
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const mimeType = extractMimeType(contentType);
  return mimeType === 'application/json' || mimeType.endsWith('+json');
}

async function buildContentFromResponse(response: Response): Promise<FetchContent[]> {
  const contentType = response.headers.get('content-type');

  if (isImageContentType(contentType)) {
    const mimeType = extractMimeType(contentType!);
    const buffer = Buffer.from(await response.arrayBuffer());
    return [{ type: 'image', data: buffer.toString('base64'), mimeType }];
  }

  if (isJsonContentType(contentType)) {
    const json = await response.json();
    return [{ type: 'text', text: JSON.stringify(json, null, 2) }];
  }

  // For all other content types (text/plain, text/html, application/octet-stream, etc.)
  // return as text with content-type info
  const text = await response.text();
  const prefix = contentType ? `Content-Type: ${contentType}\n\n` : '';
  return [{ type: 'text', text: `${prefix}${text}` }];
}

export async function fetchTool(
  jiraClient: JiraClient,
  confluenceClient: ConfluenceClient,
  jiraBaseUrl: string,
  confluenceBaseUrl: string,
  input: FetchInput
): Promise<FetchContent[]> {
  // SSRF protection: validate URL starts with configured base URLs
  const isJiraUrl = input.url.startsWith(jiraBaseUrl);
  const isConfluenceUrl = input.url.startsWith(confluenceBaseUrl);

  if (!isJiraUrl && !isConfluenceUrl) {
    return [
      {
        type: 'text',
        text: `Error: URL must begin with "${jiraBaseUrl}" or "${confluenceBaseUrl}". Refusing to fetch arbitrary URLs for SSRF protection.`,
      },
    ];
  }

  const method = input.method || 'GET';
  const client = isJiraUrl ? jiraClient : confluenceClient;
  const baseUrl = isJiraUrl ? jiraBaseUrl : confluenceBaseUrl;
  const path = input.url.slice(baseUrl.length);

  if (method === 'DELETE') {
    if (isJiraUrl) {
      await jiraClient.delete(path);
    } else {
      await confluenceClient.delete(path);
    }
    return [{ type: 'text', text: 'DELETE successful (204 No Content)' }];
  }

  const response = await client.getRawResponse(path, method, input.body, input.headers);
  return buildContentFromResponse(response);
}
