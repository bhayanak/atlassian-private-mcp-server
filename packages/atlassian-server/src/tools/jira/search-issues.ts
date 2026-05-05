import { z } from 'zod';
import { JiraClient } from '../../jira/client.js';
import { JiraSearchResult } from '../../jira/types.js';
import { formatJiraSearchResults } from '../../utils/format.js';

export const searchJiraIssuesUsingJqlSchema = z.object({
  jql: z
    .string()
    .describe(
      "JQL query string. Examples: 'project = STOR AND status = Open', 'assignee = currentUser() AND updated >= -7d'"
    ),
  fields: z
    .array(z.string())
    .optional()
    .describe(
      "Fields to return per issue. Defaults to: summary, status, assignee, priority, issuetype, created, updated. Use '*all' for all fields."
    ),
  maxResults: z.number().optional().describe('Max results to return (default: 50, max: 100)'),
  startAt: z.number().optional().describe('Pagination offset (default: 0)'),
  orderBy: z.string().optional().describe("JQL ORDER BY clause, e.g. 'created DESC'"),
});

export type SearchJiraIssuesUsingJqlInput = z.infer<typeof searchJiraIssuesUsingJqlSchema>;

export async function searchJiraIssuesUsingJql(
  client: JiraClient,
  input: SearchJiraIssuesUsingJqlInput,
  baseUrl: string,
  defaultMaxResults: number
): Promise<string> {
  let jql = input.jql;
  if (input.orderBy) {
    jql += ` ORDER BY ${input.orderBy}`;
  }

  const maxResults = Math.min(input.maxResults ?? defaultMaxResults, 100);

  const body = {
    jql,
    fields: input.fields || [
      'summary',
      'status',
      'assignee',
      'priority',
      'issuetype',
      'created',
      'updated',
    ],
    maxResults,
    startAt: input.startAt ?? 0,
  };

  const result = await client.post<JiraSearchResult>('/rest/api/2/search', body);

  const header = `JQL: ${jql}\n`;
  return header + formatJiraSearchResults(result as unknown as Record<string, unknown>, baseUrl);
}
