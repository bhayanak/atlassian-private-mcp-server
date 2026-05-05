<p align="center">
  <img src="../../logo.svg" width="128" height="128" alt="Atlassian Private MCP Server" />
</p>

# Atlassian Private MCP Server

MCP server providing 24 tools for interacting with private/self-hosted Jira Data Center and Confluence Server/DC instances.

## Client Configuration

### VS Code / GitHub Copilot

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "atlassian-private": {
      "command": "npx",
      "args": ["-y", "atlassian-server"],
      "env": {
        "JIRA_BASE_URL": "${input:jiraBaseUrl}",
        "JIRA_PAT": "${input:jiraPat}",
        "CONFLUENCE_BASE_URL": "${input:confluenceBaseUrl}",
        "CONFLUENCE_PAT": "${input:confluencePat}"
      }
    }
  },
  "inputs": [
    { "id": "jiraBaseUrl", "type": "promptString", "description": "Jira DC base URL" },
    { "id": "jiraPat", "type": "promptString", "description": "Jira Personal Access Token", "password": true },
    { "id": "confluenceBaseUrl", "type": "promptString", "description": "Confluence base URL" },
    { "id": "confluencePat", "type": "promptString", "description": "Confluence Personal Access Token", "password": true }
  ]
}
```

Or install the [Atlassian Private MCP VS Code Extension](../atlassian-vscode-extension/) for automatic registration with a settings UI.

### Claude Desktop

Add to `claude_desktop_config.json` (`~/Library/Application Support/Claude/` on macOS, `%APPDATA%\Claude\` on Windows):

```json
{
  "mcpServers": {
    "atlassian-private": {
      "command": "npx",
      "args": ["-y", "atlassian-server"],
      "env": {
        "JIRA_BASE_URL": "https://jira.yourcompany.com",
        "JIRA_AUTH_TYPE": "pat",
        "JIRA_PAT": "your-token",
        "CONFLUENCE_BASE_URL": "https://confluence.yourcompany.com",
        "CONFLUENCE_AUTH_TYPE": "pat",
        "CONFLUENCE_PAT": "your-token"
      }
    }
  }
}
```

### Cursor

Add to Cursor Settings → MCP → Add Server, or in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "atlassian-private": {
      "command": "npx",
      "args": ["-y", "atlassian-server"],
      "env": {
        "JIRA_BASE_URL": "https://jira.yourcompany.com",
        "JIRA_PAT": "your-token",
        "CONFLUENCE_BASE_URL": "https://confluence.yourcompany.com",
        "CONFLUENCE_PAT": "your-token"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JIRA_BASE_URL` | Yes* | Jira Data Center base URL (HTTPS) |
| `JIRA_AUTH_TYPE` | No | `pat` (default) or `basic` |
| `JIRA_PAT` | Yes* | Personal Access Token (Jira DC 8.14+) |
| `JIRA_USERNAME` | No | Username (for basic auth only) |
| `JIRA_PASSWORD` | No | Password (for basic auth only) |
| `CONFLUENCE_BASE_URL` | Yes* | Confluence Server/DC base URL (HTTPS) |
| `CONFLUENCE_AUTH_TYPE` | No | `pat` (default) or `basic` |
| `CONFLUENCE_PAT` | Yes* | Personal Access Token (Confluence DC 7.9+) |
| `CONFLUENCE_USERNAME` | No | Username (for basic auth only) |
| `CONFLUENCE_PASSWORD` | No | Password (for basic auth only) |
| `NODE_TLS_REJECT_UNAUTHORIZED` | No | Set to `0` for self-signed certs |

*At least one of Jira or Confluence must be configured.

## Tools (24 total)

### Jira — Read (7)
| Tool | Description |
|------|-------------|
| `getJiraIssue` | Get issue by key/ID with full details |
| `getJiraIssueRemoteIssueLinks` | List remote links on an issue |
| `getJiraIssueTypeMetaWithFields` | Create-field metadata for project + issue type |
| `getJiraProjectIssueTypesMetadata` | List issue types in a project |
| `getIssueLinkTypes` | List available link types |
| `getTransitionsForJiraIssue` | List workflow transitions |
| `getVisibleJiraProjects` | List accessible projects |

### Jira — Write (7)
| Tool | Description |
|------|-------------|
| `createJiraIssue` | Create a new issue |
| `editJiraIssue` | Update issue fields |
| `transitionJiraIssue` | Perform workflow transition |
| `addCommentToJiraIssue` | Add a comment |
| `addWorklogToJiraIssue` | Log time |
| `createIssueLink` | Link two issues |
| `lookupJiraAccountId` | Find users by name/email |

### Jira — Search (1)
| Tool | Description |
|------|-------------|
| `searchJiraIssuesUsingJql` | Search with JQL (full syntax) |

### Confluence — Read (7)
| Tool | Description |
|------|-------------|
| `getConfluencePage` | Get page by ID with body content |
| `getConfluencePageDescendants` | List child pages |
| `getConfluencePageFooterComments` | Footer comments on a page |
| `getConfluencePageInlineComments` | Inline comments on a page |
| `getConfluenceCommentChildren` | Replies to a comment |
| `getConfluenceSpaces` | List spaces |
| `getPagesInConfluenceSpace` | Pages in a space |

### Confluence — Write (4)
| Tool | Description |
|------|-------------|
| `createConfluencePage` | Create a new page |
| `updateConfluencePage` | Update page content |
| `createConfluenceFooterComment` | Add footer comment |
| `createConfluenceInlineComment` | Add inline comment |

### Confluence — Search (1)
| Tool | Description |
|------|-------------|
| `searchConfluenceUsingCql` | Search with CQL (full syntax) |

### Common (2)
| Tool | Description |
|------|-------------|
| `atlassianUserInfo` | Current authenticated user info |
| `fetch` | Generic REST call (SSRF-protected, restricted to configured URLs) |

## Compatibility

| Product | Versions | Auth |
|---------|----------|------|
| Jira Server/DC | 7.x – 9.x | Basic, PAT (8.14+) |
| Confluence Server/DC | 6.x – 8.x | Basic, PAT (7.9+) |

## Development

```bash
pnpm install
pnpm run build        # Build with tsup
pnpm run test         # Run tests
pnpm run test:coverage # Coverage report
pnpm run dev          # Dev mode with tsx
pnpm run typecheck    # TypeScript check
```
