const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Bundle the VS Code extension host
esbuild.buildSync({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  platform: 'node',
  format: 'cjs',
  sourcemap: true,
});

// Bundle the MCP server into extension dist (CJS so Node can run it without --experimental flags)
esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, '../atlassian-server/src/index.ts')],
  bundle: true,
  outfile: 'dist/server/index.js',
  platform: 'node',
  format: 'cjs',
  sourcemap: true,
});

// Strip shebang from bundled server (spawned by extension, not executed directly)
const serverFile = path.resolve(__dirname, 'dist/server/index.js');
const content = fs.readFileSync(serverFile, 'utf8');
if (content.startsWith('#!')) {
  fs.writeFileSync(serverFile, content.replace(/^#![^\n]*\n/, ''));
}

console.log('✅ Extension and server bundled successfully');
