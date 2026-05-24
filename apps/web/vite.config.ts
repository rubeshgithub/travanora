import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Resolve ./foo.js → ./foo.ts or ./foo.tsx when the .js file doesn't exist.
// Needed because TypeScript ESM convention writes .js in import statements.
function resolveJsToTs(): Plugin {
  return {
    name: 'resolve-js-to-ts',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.match(/\.(js|jsx)$/)) return null;
      const dir = path.dirname(importer);
      const base = source.replace(/\.(js|jsx)$/, '');
      const candidates = source.endsWith('.jsx')
        ? [base + '.tsx', base + '.ts']
        : [base + '.ts', base + '.tsx'];
      for (const c of candidates) {
        const abs = path.isAbsolute(c) ? c : path.resolve(dir, c);
        if (fs.existsSync(abs)) return abs;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [resolveJsToTs(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@travanora/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
  },
});
