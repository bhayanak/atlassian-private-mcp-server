import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JiraClient } from '../src/jira/client.js';
import { getJiraIssueTypeMetaWithFields } from '../src/tools/jira/get-issue-type-meta.js';
import { getJiraProjectIssueTypesMetadata } from '../src/tools/jira/get-project-issue-types.js';
import { lookupJiraAccountId } from '../src/tools/jira/lookup-account.js';
import type { JiraConfig } from '../src/config.js';

const mockConfig: JiraConfig = {
  baseUrl: 'https://jira.example.com',
  auth: { type: 'pat', pat: 'test-token' },
  maxResults: 50,
  requestTimeoutMs: 30000,
};

describe('Version Compatibility Tests', () => {
  let client: JiraClient;

  beforeEach(() => {
    client = new JiraClient(mockConfig);
    vi.restoreAllMocks();
  });

  describe('getJiraIssueTypeMetaWithFields - version fallback', () => {
    it('uses new endpoint for Jira 8.4+', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // First call: serverInfo
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ version: '8.20.0', versionNumbers: [8, 20, 0], buildNumber: 820000 }),
          { status: 200 }
        )
      );

      // Second call: new createmeta endpoint
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            values: [
              { key: 'summary', name: 'Summary', required: true, schema: { type: 'string' } },
              {
                key: 'description',
                name: 'Description',
                required: false,
                schema: { type: 'string' },
              },
            ],
            total: 2,
          }),
          { status: 200 }
        )
      );

      const result = await getJiraIssueTypeMetaWithFields(client, {
        projectKeyOrId: 'TEST',
        issueTypeId: '10001',
      });

      expect(result).toContain('Summary');
      // Verify it called the new endpoint
      const secondCallUrl = fetchSpy.mock.calls[1][0];
      expect(secondCallUrl).toContain('/rest/api/2/issue/createmeta/TEST/issuetypes/10001');
    });

    it('uses old endpoint for Jira 7.x', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // serverInfo
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ version: '7.13.0', versionNumbers: [7, 13, 0], buildNumber: 713000 }),
          { status: 200 }
        )
      );

      // Old createmeta endpoint
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            projects: [
              {
                key: 'TEST',
                issuetypes: [
                  {
                    id: '10001',
                    name: 'Bug',
                    fields: {
                      summary: { name: 'Summary', required: true, schema: { type: 'string' } },
                    },
                  },
                ],
              },
            ],
          }),
          { status: 200 }
        )
      );

      const result = await getJiraIssueTypeMetaWithFields(client, {
        projectKeyOrId: 'TEST',
        issueTypeId: '10001',
      });

      expect(result).toContain('Summary');
      // Verify it called the old endpoint
      const secondCallUrl = fetchSpy.mock.calls[1][0];
      expect(secondCallUrl).toContain('/rest/api/2/issue/createmeta?');
      expect(secondCallUrl).toContain('projectKeys=TEST');
    });
  });

  describe('getJiraProjectIssueTypesMetadata - version fallback', () => {
    it('uses new endpoint for Jira 8.4+', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ version: '9.0.0', versionNumbers: [9, 0, 0], buildNumber: 900000 }),
          { status: 200 }
        )
      );

      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            values: [
              { id: '10001', name: 'Bug', subtask: false },
              { id: '10002', name: 'Story', subtask: false },
            ],
            total: 2,
          }),
          { status: 200 }
        )
      );

      const result = await getJiraProjectIssueTypesMetadata(client, {
        projectKeyOrId: 'TEST',
      });

      expect(result).toContain('Bug');
      expect(result).toContain('Story');
      const secondCallUrl = fetchSpy.mock.calls[1][0];
      expect(secondCallUrl).toContain('/rest/api/2/issue/createmeta/TEST/issuetypes');
    });

    it('uses old endpoint for Jira < 8.4', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ version: '8.0.0', versionNumbers: [8, 0, 0], buildNumber: 800000 }),
          { status: 200 }
        )
      );

      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            projects: [
              {
                key: 'TEST',
                issuetypes: [
                  { id: '10001', name: 'Bug', subtask: false },
                  { id: '10002', name: 'Task', subtask: false },
                ],
              },
            ],
          }),
          { status: 200 }
        )
      );

      const result = await getJiraProjectIssueTypesMetadata(client, {
        projectKeyOrId: 'TEST',
      });

      expect(result).toContain('Bug');
      expect(result).toContain('Task');
      const secondCallUrl = fetchSpy.mock.calls[1][0];
      expect(secondCallUrl).toContain('/rest/api/2/issue/createmeta?');
    });
  });

  describe('lookupJiraAccountId - endpoint fallback', () => {
    it('uses /user/picker first', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            users: [{ name: 'jsmith', key: 'jsmith', displayName: 'John Smith' }],
          }),
          { status: 200 }
        )
      );

      const result = await lookupJiraAccountId(client, { query: 'john' });

      expect(result).toContain('jsmith');
      expect(result).toContain('John Smith');
      const callUrl = fetchSpy.mock.calls[0][0];
      expect(callUrl).toContain('/rest/api/2/user/picker');
    });

    it('falls back to /user/search on failure', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // /user/picker fails (404 on older instances)
      fetchSpy.mockResolvedValueOnce(
        new Response('Not Found', { status: 404, statusText: 'Not Found' })
      );

      // Falls back to /user/search
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              name: 'jsmith',
              displayName: 'John Smith',
              emailAddress: 'john@example.com',
              active: true,
            },
          ]),
          { status: 200 }
        )
      );

      const result = await lookupJiraAccountId(client, { query: 'john' });

      expect(result).toContain('jsmith');
      expect(fetchSpy.mock.calls[1][0]).toContain('/rest/api/2/user/search');
    });
  });
});
