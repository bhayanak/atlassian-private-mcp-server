import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AppConfig } from "./config.js";
import { JiraClient } from "./jira/client.js";
import { ConfluenceClient } from "./confluence/client.js";

// Jira tools
import { getJiraIssueSchema, getJiraIssue } from "./tools/jira/get-issue.js";
import { getJiraIssueRemoteIssueLinksSchema, getJiraIssueRemoteIssueLinks } from "./tools/jira/get-issue-remote-links.js";
import { getJiraIssueTypeMetaWithFieldsSchema, getJiraIssueTypeMetaWithFields } from "./tools/jira/get-issue-type-meta.js";
import { getJiraProjectIssueTypesMetadataSchema, getJiraProjectIssueTypesMetadata } from "./tools/jira/get-project-issue-types.js";
import { getIssueLinkTypes } from "./tools/jira/get-issue-link-types.js";
import { getTransitionsForJiraIssueSchema, getTransitionsForJiraIssue } from "./tools/jira/get-transitions.js";
import { getVisibleJiraProjectsSchema, getVisibleJiraProjects } from "./tools/jira/get-projects.js";
import { lookupJiraAccountIdSchema, lookupJiraAccountId } from "./tools/jira/lookup-account.js";
import { addCommentToJiraIssueSchema, addCommentToJiraIssue } from "./tools/jira/add-comment.js";
import { addWorklogToJiraIssueSchema, addWorklogToJiraIssue } from "./tools/jira/add-worklog.js";
import { createJiraIssueSchema, createJiraIssue } from "./tools/jira/create-issue.js";
import { createIssueLinkSchema, createIssueLink } from "./tools/jira/create-issue-link.js";
import { editJiraIssueSchema, editJiraIssue } from "./tools/jira/edit-issue.js";
import { transitionJiraIssueSchema, transitionJiraIssue } from "./tools/jira/transition-issue.js";
import { searchJiraIssuesUsingJqlSchema, searchJiraIssuesUsingJql } from "./tools/jira/search-issues.js";

// Confluence tools
import { getConfluencePageSchema, getConfluencePage } from "./tools/confluence/get-page.js";
import { getConfluencePageDescendantsSchema, getConfluencePageDescendants } from "./tools/confluence/get-page-descendants.js";
import { getConfluencePageFooterCommentsSchema, getConfluencePageFooterComments } from "./tools/confluence/get-footer-comments.js";
import { getConfluencePageInlineCommentsSchema, getConfluencePageInlineComments } from "./tools/confluence/get-inline-comments.js";
import { getConfluenceCommentChildrenSchema, getConfluenceCommentChildren } from "./tools/confluence/get-comment-children.js";
import { getConfluenceSpacesSchema, getConfluenceSpaces } from "./tools/confluence/get-spaces.js";
import { getPagesInConfluenceSpaceSchema, getPagesInConfluenceSpace } from "./tools/confluence/get-pages-in-space.js";
import { createConfluencePageSchema, createConfluencePage } from "./tools/confluence/create-page.js";
import { updateConfluencePageSchema, updateConfluencePage } from "./tools/confluence/update-page.js";
import { createConfluenceFooterCommentSchema, createConfluenceFooterComment } from "./tools/confluence/create-footer-comment.js";
import { createConfluenceInlineCommentSchema, createConfluenceInlineComment } from "./tools/confluence/create-inline-comment.js";
import { searchConfluenceUsingCqlSchema, searchConfluenceUsingCql } from "./tools/confluence/search-content.js";

// Common tools
import { atlassianUserInfo } from "./tools/common/user-info.js";
import { fetchSchema, fetchTool } from "./tools/common/fetch.js";

export function createServer(config: AppConfig): McpServer {
  const server = new McpServer({
    name: "atlassian-mcp-private",
    version: "0.1.0",
  });

  const jiraClient = new JiraClient(config.jira);
  const confluenceClient = new ConfluenceClient(config.confluence);
  const jiraBaseUrl = config.jira.baseUrl;
  const confluenceBaseUrl = config.confluence.baseUrl;

  // === JIRA READ TOOLS ===

  server.tool(
    "getJiraIssue",
    "Get a Jira issue by ID or key. Returns full issue details including status, assignee, description, and custom fields.",
    getJiraIssueSchema.shape,
    async ({ issueIdOrKey, expand }) => ({
      content: [{ type: "text", text: await getJiraIssue(jiraClient, { issueIdOrKey, expand }, jiraBaseUrl) }],
    })
  );

  server.tool(
    "getJiraIssueRemoteIssueLinks",
    "List remote issue links (e.g., Confluence links, external URLs) on a Jira issue.",
    getJiraIssueRemoteIssueLinksSchema.shape,
    async ({ issueIdOrKey }) => ({
      content: [{ type: "text", text: await getJiraIssueRemoteIssueLinks(jiraClient, { issueIdOrKey }) }],
    })
  );

  server.tool(
    "getJiraIssueTypeMetaWithFields",
    "Get create-field metadata for a project and issue type. Shows required and optional fields for creating issues.",
    getJiraIssueTypeMetaWithFieldsSchema.shape,
    async ({ projectKeyOrId, issueTypeId }) => ({
      content: [{ type: "text", text: await getJiraIssueTypeMetaWithFields(jiraClient, { projectKeyOrId, issueTypeId }) }],
    })
  );

  server.tool(
    "getJiraProjectIssueTypesMetadata",
    "List issue types available in a Jira project (Bug, Story, Task, etc.).",
    getJiraProjectIssueTypesMetadataSchema.shape,
    async ({ projectKeyOrId }) => ({
      content: [{ type: "text", text: await getJiraProjectIssueTypesMetadata(jiraClient, { projectKeyOrId }) }],
    })
  );

  server.tool(
    "getIssueLinkTypes",
    "List available issue link types (Blocks, Duplicate, Relates, etc.).",
    {},
    async () => ({
      content: [{ type: "text", text: await getIssueLinkTypes(jiraClient) }],
    })
  );

  server.tool(
    "getTransitionsForJiraIssue",
    "List available workflow transitions for an issue. Use the returned transition IDs with transitionJiraIssue.",
    getTransitionsForJiraIssueSchema.shape,
    async ({ issueIdOrKey }) => ({
      content: [{ type: "text", text: await getTransitionsForJiraIssue(jiraClient, { issueIdOrKey }) }],
    })
  );

  server.tool(
    "getVisibleJiraProjects",
    "List Jira projects the authenticated user can access.",
    getVisibleJiraProjectsSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await getVisibleJiraProjects(jiraClient, args) }],
    })
  );

  server.tool(
    "lookupJiraAccountId",
    "Find Jira users by name, display name, or email. Returns usernames for use in assignee/reporter fields.",
    lookupJiraAccountIdSchema.shape,
    async ({ query, maxResults }) => ({
      content: [{ type: "text", text: await lookupJiraAccountId(jiraClient, { query, maxResults }) }],
    })
  );

  // === JIRA WRITE TOOLS ===

  server.tool(
    "addCommentToJiraIssue",
    "Add a comment to a Jira issue. Supports plain text or Jira wiki markup.",
    addCommentToJiraIssueSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await addCommentToJiraIssue(jiraClient, args) }],
    })
  );

  server.tool(
    "addWorklogToJiraIssue",
    "Add a time-tracking worklog entry to a Jira issue.",
    addWorklogToJiraIssueSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await addWorklogToJiraIssue(jiraClient, args) }],
    })
  );

  server.tool(
    "createJiraIssue",
    "Create a new Jira issue (Bug, Story, Task, etc.) in a project.",
    createJiraIssueSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await createJiraIssue(jiraClient, args, jiraBaseUrl) }],
    })
  );

  server.tool(
    "createIssueLink",
    "Create a link between two Jira issues (Blocks, Duplicate, Relates, etc.).",
    createIssueLinkSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await createIssueLink(jiraClient, args) }],
    })
  );

  server.tool(
    "editJiraIssue",
    "Update fields on an existing Jira issue (summary, description, assignee, priority, labels, etc.).",
    editJiraIssueSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await editJiraIssue(jiraClient, args) }],
    })
  );

  server.tool(
    "transitionJiraIssue",
    "Perform a workflow transition on a Jira issue (e.g., Open → In Progress → Done).",
    transitionJiraIssueSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await transitionJiraIssue(jiraClient, args) }],
    })
  );

  // === JIRA SEARCH ===

  server.tool(
    "searchJiraIssuesUsingJql",
    "Search Jira issues using JQL (Jira Query Language). Supports full JQL syntax including project, status, assignee, labels, dates, etc.",
    searchJiraIssuesUsingJqlSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await searchJiraIssuesUsingJql(jiraClient, args, jiraBaseUrl, config.jira.maxResults) }],
    })
  );

  // === CONFLUENCE READ TOOLS ===

  server.tool(
    "getConfluencePage",
    "Get a Confluence page by ID. Returns title, space, version, ancestors, and optionally the full page body content.",
    getConfluencePageSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await getConfluencePage(confluenceClient, args, confluenceBaseUrl) }],
    })
  );

  server.tool(
    "getConfluencePageDescendants",
    "List descendant (child) pages under a parent page.",
    getConfluencePageDescendantsSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await getConfluencePageDescendants(confluenceClient, args, confluenceBaseUrl) }],
    })
  );

  server.tool(
    "getConfluencePageFooterComments",
    "List footer comments on a Confluence page.",
    getConfluencePageFooterCommentsSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await getConfluencePageFooterComments(confluenceClient, args) }],
    })
  );

  server.tool(
    "getConfluencePageInlineComments",
    "List inline comments (annotations) on a Confluence page.",
    getConfluencePageInlineCommentsSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await getConfluencePageInlineComments(confluenceClient, args) }],
    })
  );

  server.tool(
    "getConfluenceCommentChildren",
    "List child comments (replies) of a specific comment.",
    getConfluenceCommentChildrenSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await getConfluenceCommentChildren(confluenceClient, args) }],
    })
  );

  server.tool(
    "getConfluenceSpaces",
    "List Confluence spaces (global, personal, or all).",
    getConfluenceSpacesSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await getConfluenceSpaces(confluenceClient, args, confluenceBaseUrl) }],
    })
  );

  server.tool(
    "getPagesInConfluenceSpace",
    "List pages in a Confluence space. Supports title filtering and pagination.",
    getPagesInConfluenceSpaceSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await getPagesInConfluenceSpace(confluenceClient, args, confluenceBaseUrl) }],
    })
  );

  // === CONFLUENCE WRITE TOOLS ===

  server.tool(
    "createConfluencePage",
    "Create a new Confluence page in a space. Supports storage format (XHTML), wiki markup, or plain text.",
    createConfluencePageSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await createConfluencePage(confluenceClient, args, confluenceBaseUrl) }],
    })
  );

  server.tool(
    "updateConfluencePage",
    "Update an existing Confluence page (title, body content, or both). Handles version numbering automatically.",
    updateConfluencePageSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await updateConfluencePage(confluenceClient, args, confluenceBaseUrl) }],
    })
  );

  server.tool(
    "createConfluenceFooterComment",
    "Create a footer comment or reply on a Confluence page.",
    createConfluenceFooterCommentSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await createConfluenceFooterComment(confluenceClient, args, confluenceBaseUrl) }],
    })
  );

  server.tool(
    "createConfluenceInlineComment",
    "Create an inline comment tied to selected text on a Confluence page.",
    createConfluenceInlineCommentSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await createConfluenceInlineComment(confluenceClient, args, confluenceBaseUrl) }],
    })
  );

  // === CONFLUENCE SEARCH ===

  server.tool(
    "searchConfluenceUsingCql",
    "Search Confluence content using CQL (Confluence Query Language). Supports space, title, label, type, and date filters.",
    searchConfluenceUsingCqlSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await searchConfluenceUsingCql(confluenceClient, args, confluenceBaseUrl, config.confluence.maxResults) }],
    })
  );

  // === COMMON / UTILITY TOOLS ===

  server.tool(
    "atlassianUserInfo",
    "Get info about the currently authenticated user (username, display name, email, connected instances).",
    {},
    async () => ({
      content: [{ type: "text", text: await atlassianUserInfo(jiraClient, jiraBaseUrl, confluenceBaseUrl) }],
    })
  );

  server.tool(
    "fetch",
    "Generic HTTP fetch for Atlassian REST API endpoints not covered by other tools. Restricted to configured Jira/Confluence base URLs only.",
    fetchSchema.shape,
    async (args) => ({
      content: [{ type: "text", text: await fetchTool(jiraClient, confluenceClient, jiraBaseUrl, confluenceBaseUrl, args) }],
    })
  );

  return server;
}
