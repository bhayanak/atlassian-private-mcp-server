<p align="center">
  <img src="logo.png" width="320" height="320" alt="Atlassian Private MCP Server" />
</p>

<h1 align="center">Atlassian Private MCP Server</h1>

<p align="center">
  <strong>MCP server for private/self-hosted Jira Data Center and Confluence Server/DC — issues, pages, comments, workflows, and search</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green.svg" alt="Node.js >= 18" />
  <img src="https://img.shields.io/badge/MCP-compatible-purple.svg" alt="MCP Compatible" />
  <img src="https://img.shields.io/badge/tools-24-orange.svg" alt="24 Tools" />
</p>

---

A **Model Context Protocol (MCP) server** that enables AI assistants (GitHub Copilot, Claude, etc.) to interact with private/self-hosted Atlassian instances. Manage Jira issues, search with JQL, transition workflows, create Confluence pages, search with CQL, and more — all through natural language.

> The official Atlassian MCP server only works with Atlassian Cloud. This project fills the gap for on-premise deployments.

## Monorepo Structure

```
packages/
  atlassian-server/          # MCP server (24 tools)
  atlassian-vscode-extension/ # VS Code extension
```

## Quick Start

### As a standalone MCP server

```bash
# Install
npm install -g atlassian-server

# Set environment variables
export JIRA_BASE_URL="https://jira.yourcompany.com"
export JIRA_PAT="your-personal-access-token"
export CONFLUENCE_BASE_URL="https://confluence.yourcompany.com"
export CONFLUENCE_PAT="your-personal-access-token"

# Run
atlassian-mcp-private
```

### As a VS Code extension

Install the VSIX from releases, set your instance URLs and PATs in Settings > Atlassian Private MCP, and the server appears in your MCP Servers panel automatically.

## Documentation

- [Server Documentation](packages/atlassian-server/README.md) — All 24 tools, configuration, API reference
- [VS Code Extension](packages/atlassian-vscode-extension/README.md) — Installation, configuration, usage

## Usage Examples

Once the MCP server is running (standalone or via the VS Code extension), ask your AI assistant:

| Prompt | Tool Used |
|--------|-----------|
| "Get the details of Jira issue PROJ-123" | `getJiraIssue` |
| "Search for open bugs assigned to me in project PLATFORM" | `searchJiraIssuesUsingJql` |
| "Create a new Bug in project INFRA with summary 'Login page broken'" | `createJiraIssue` |
| "Transition PROJ-456 to In Progress" | `transitionJiraIssue` |
| "Add a comment to PROJ-789 saying the fix is deployed" | `addCommentToJiraIssue` |
| "List all Confluence spaces" | `getConfluenceSpaces` |
| "Get the content of Confluence page 12345" | `getConfluencePage` |
| "Search Confluence for pages about deployment in the DEVOPS space" | `searchConfluenceUsingCql` |
| "Create a new page in the TEAM space titled 'Sprint Retro'" | `createConfluencePage` |
| "Who am I logged in as?" | `atlassianUserInfo` |

## Compatibility

| Product | Versions | Auth |
|---------|----------|------|
| Jira Server/DC | 7.x – 9.x | Basic, PAT (8.14+) |
| Confluence Server/DC | 6.x – 8.x | Basic, PAT (7.9+) |

## License

[MIT](LICENSE)
