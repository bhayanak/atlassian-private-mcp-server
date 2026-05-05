import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfluenceClient } from '../src/confluence/client.js';
import type { ConfluenceConfig } from '../src/config.js';

const mockConfig: ConfluenceConfig = {
  baseUrl: 'https://confluence.example.com',
  auth: { type: 'basic', username: 'admin', password: 'secret' },
  maxResults: 25,
  requestTimeoutMs: 30000,
};

describe('ConfluenceClient', () => {
  let client: ConfluenceClient;

  beforeEach(() => {
    client = new ConfluenceClient(mockConfig);
    vi.restoreAllMocks();
  });

  describe('get()', () => {
    it('makes GET with basic auth header', async () => {
      const mockPage = { id: '12345', title: 'Test Page' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockPage), { status: 200 })
      );

      const result = await client.get<typeof mockPage>('/rest/api/content/12345');

      expect(result).toEqual(mockPage);
      const expectedAuth = 'Basic ' + Buffer.from('admin:secret').toString('base64');
      expect(fetch).toHaveBeenCalledWith(
        'https://confluence.example.com/rest/api/content/12345',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expectedAuth,
          }),
        })
      );
    });

    it('throws ConfluenceApiError on error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Page not found', { status: 404, statusText: 'Not Found' })
      );

      await expect(client.get('/rest/api/content/99999')).rejects.toThrow(
        'Confluence API error 404 Not Found'
      );
    });
  });

  describe('post()', () => {
    it('sends POST with CSRF header', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ id: '123' }), { status: 200 })
      );

      await client.post('/rest/api/content', { type: 'page' });

      expect(fetch).toHaveBeenCalledWith(
        'https://confluence.example.com/rest/api/content',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Atlassian-Token': 'no-check',
          }),
        })
      );
    });
  });

  describe('delete()', () => {
    it('sends DELETE request', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

      await client.delete('/rest/api/content/12345');

      expect(fetch).toHaveBeenCalledWith(
        'https://confluence.example.com/rest/api/content/12345',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'X-Atlassian-Token': 'no-check',
          }),
        })
      );
    });
  });
});
