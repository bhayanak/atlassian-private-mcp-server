import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const serverPath = vscode.Uri.joinPath(
    context.extensionUri,
    'dist',
    'server',
    'index.js'
  ).fsPath;

  const disposable = vscode.lm.registerMcpServerDefinitionProvider(
    'atlassian-private-mcp',
    {
      provideMcpServerDefinitions(
        _token: vscode.CancellationToken
      ): vscode.ProviderResult<vscode.McpServerDefinition[]> {
        const config = vscode.workspace.getConfiguration('atlassianPrivateMcp');

        const jiraBaseUrl = config.get<string>('jiraBaseUrl', '');
        const confluenceBaseUrl = config.get<string>('confluenceBaseUrl', '');

        // Don't register server if no base URLs configured
        if (!jiraBaseUrl && !confluenceBaseUrl) {
          return [];
        }

        return [
          new vscode.McpStdioServerDefinition(
            'Atlassian Private MCP Server',
            process.execPath,
            [serverPath],
            {
              JIRA_BASE_URL: jiraBaseUrl,
              JIRA_AUTH_TYPE: config.get<string>('jiraAuthType', 'pat'),
              JIRA_PAT: config.get<string>('jiraPat', ''),
              JIRA_USERNAME: config.get<string>('jiraUsername', ''),
              JIRA_PASSWORD: config.get<string>('jiraPassword', ''),
              CONFLUENCE_BASE_URL: confluenceBaseUrl,
              CONFLUENCE_AUTH_TYPE: config.get<string>('confluenceAuthType', 'pat'),
              CONFLUENCE_PAT: config.get<string>('confluencePat', ''),
              CONFLUENCE_USERNAME: config.get<string>('confluenceUsername', ''),
              CONFLUENCE_PASSWORD: config.get<string>('confluencePassword', ''),
              NODE_TLS_REJECT_UNAUTHORIZED: config.get<boolean>(
                'tlsRejectUnauthorized',
                true
              )
                ? '1'
                : '0',
            },
            '0.1.0'
          ),
        ];
      },
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
