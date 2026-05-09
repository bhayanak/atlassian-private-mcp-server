# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-07-22

### Fixed
- **Binary file fetch crash**: Fixed `fetch` tool failing with `Unexpected token '�', '�PNG...' is not valid JSON` when fetching binary files (e.g., PNG/JPEG attachments from Jira). The tool now detects the response `Content-Type` and returns image content as base64-encoded MCP `ImageContent` instead of attempting JSON parse.

### Added
- `getRawResponse()` method on `JiraClient` and `ConfluenceClient` for content-type-aware HTTP requests.
- Image support in the `fetch` tool: responses with `image/*` content types (PNG, JPEG, GIF, WebP, SVG, BMP, TIFF) are returned as MCP `ImageContent` with base64 data.
- Non-JSON text responses (HTML, plain text, etc.) are returned with content-type metadata instead of crashing.
- Comprehensive tests for binary/image response handling in the fetch tool.

### Changed
- `fetchTool()` return type changed from `string` to `FetchContent[]` (array of text or image content blocks) to support mixed response types via MCP protocol.

## [0.1.0] - 2025-07-20

### Added
- Initial release with 24 MCP tools for Jira Server/DC and Confluence Server/DC.
- PAT and Basic Auth support for private/self-hosted Atlassian instances.
- SSRF protection on the `fetch` tool restricting requests to configured base URLs.
- VS Code extension with auto-registration of the MCP server.
- Monorepo structure with `atlassian-server` and `atlassian-vscode-extension` packages.
- CI/CD with GitHub Actions (Node 18/20/22 matrix).
- 75%+ code coverage with vitest.
