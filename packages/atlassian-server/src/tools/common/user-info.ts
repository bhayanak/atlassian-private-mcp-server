import { JiraClient } from '../../jira/client.js';
import { JiraUser } from '../../jira/types.js';

export async function atlassianUserInfo(
  jiraClient: JiraClient,
  jiraBaseUrl: string,
  confluenceBaseUrl: string
): Promise<string> {
  const user = await jiraClient.get<JiraUser>('/rest/api/2/myself');

  let output = `Authenticated User Info:\n\n`;
  output += `Username: ${user.name}\n`;
  output += `Display Name: ${user.displayName}\n`;
  output += `Email: ${user.emailAddress}\n`;
  output += `Active: ${user.active}\n`;
  if (user.timeZone) {
    output += `Time Zone: ${user.timeZone}\n`;
  }
  output += `\nConnected Instances:\n`;
  output += `  Jira: ${jiraBaseUrl}\n`;
  output += `  Confluence: ${confluenceBaseUrl}\n`;

  return output;
}
