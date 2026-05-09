import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JiraClient } from '../src/jira/client.js';
import { ConfluenceClient } from '../src/confluence/client.js';
import { fetchTool } from '../src/tools/common/fetch.js';
import type { JiraConfig, ConfluenceConfig } from '../src/config.js';

const jiraConfig: JiraConfig = {
  baseUrl: 'https://jira.example.com',
  auth: { type: 'pat', pat: 'jira-token' },
  maxResults: 50,
  requestTimeoutMs: 30000,
};

const confluenceConfig: ConfluenceConfig = {
  baseUrl: 'https://confluence.example.com',
  auth: { type: 'pat', pat: 'conf-token' },
  maxResults: 25,
  requestTimeoutMs: 30000,
};

describe('fetchTool - SSRF protection', () => {
  let jiraClient: JiraClient;
  let confluenceClient: ConfluenceClient;

  beforeEach(() => {
    jiraClient = new JiraClient(jiraConfig);
    confluenceClient = new ConfluenceClient(confluenceConfig);
    vi.restoreAllMocks();
  });

  it('blocks requests to arbitrary URLs', async () => {
    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: 'https://evil.com/steal-data' }
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
    expect((result[0] as { type: 'text'; text: string }).text).toContain('SSRF protection');
  });

  it('blocks requests to localhost', async () => {
    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: 'http://localhost:8080/admin' }
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
    expect((result[0] as { type: 'text'; text: string }).text).toContain('Error');
  });

  it('allows requests to configured Jira URL and returns JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: 'https://jira.example.com/rest/api/2/serverInfo' }
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
    expect((result[0] as { type: 'text'; text: string }).text).toContain('ok');
  });

  it('allows requests to configured Confluence URL and returns JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: '123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: 'https://confluence.example.com/rest/api/content/123' }
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
    expect((result[0] as { type: 'text'; text: string }).text).toContain('123');
  });
});

describe('fetchTool - binary/image responses', () => {
  let jiraClient: JiraClient;
  let confluenceClient: ConfluenceClient;

  beforeEach(() => {
    jiraClient = new JiraClient(jiraConfig);
    confluenceClient = new ConfluenceClient(confluenceConfig);
    vi.restoreAllMocks();
  });

  it('returns image content for PNG responses', async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(pngBytes, {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      })
    );

    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: 'https://jira.example.com/secure/attachment/12345/screenshot.png' }
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('image');
    const img = result[0] as { type: 'image'; data: string; mimeType: string };
    expect(img.mimeType).toBe('image/png');
    expect(img.data).toBe(Buffer.from(pngBytes).toString('base64'));
  });

  it('returns image content for JPEG responses', async () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(jpegBytes, {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg; charset=binary' },
      })
    );

    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: 'https://jira.example.com/secure/attachment/12345/photo.jpg' }
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('image');
    const img = result[0] as { type: 'image'; data: string; mimeType: string };
    expect(img.mimeType).toBe('image/jpeg');
  });

  it('returns text content for HTML responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html><body>Hello</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    );

    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: 'https://jira.example.com/some/page' }
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
    const txt = result[0] as { type: 'text'; text: string };
    expect(txt.text).toContain('text/html');
    expect(txt.text).toContain('Hello');
  });

  it('returns text for DELETE method', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: 'https://jira.example.com/rest/api/2/issue/TEST-1', method: 'DELETE' }
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
    expect((result[0] as { type: 'text'; text: string }).text).toContain('DELETE successful');
  });

  it('returns JSON for POST with JSON response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: '999', key: 'TEST-999' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      {
        url: 'https://jira.example.com/rest/api/2/issue',
        method: 'POST',
        body: JSON.stringify({ fields: { summary: 'Test' } }),
      }
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
    expect((result[0] as { type: 'text'; text: string }).text).toContain('TEST-999');
  });

  it('handles response without content-type as text', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('some raw data', { status: 200 }));

    const result = await fetchTool(
      jiraClient,
      confluenceClient,
      jiraConfig.baseUrl,
      confluenceConfig.baseUrl,
      { url: 'https://jira.example.com/some/endpoint' }
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
    expect((result[0] as { type: 'text'; text: string }).text).toContain('some raw data');
  });
});
