import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as { version: string };

/** Hosts the browser may contact (metadata look-ups). Kept in sync with src/services/networkPolicy.ts. */
const METADATA_HOSTS = 'https://api.crossref.org https://api.openalex.org https://eutils.ncbi.nlm.nih.gov https://www.ebi.ac.uk https://doaj.org https://api.semanticscholar.org';

/**
 * Web edition: emits sw.js listing every built asset so the whole app (including the PDF worker)
 * is cached on first visit and keeps working offline. The cache name changes with the build.
 */
function precacheServiceWorker(): Plugin {
  return {
    name: 'evidence-precache-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).filter(name => !name.endsWith('.map') && name !== 'sw.js');
      const assets = ['./', './manifest.webmanifest', './icon.svg', ...files.map(name => `./${name}`)];
      const version = createHash('sha256').update(files.sort().join('|')).digest('hex').slice(0, 12);
      const source = readFileSync(path.resolve(__dirname, 'scripts/sw-template.js'), 'utf8')
        .replace('__CACHE_NAME__', `evidence-appraisal-${pkg.version}-${version}`)
        .replace('__PRECACHE__', JSON.stringify(assets));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

/** Offline edition: strict CSP inside the single HTML file (no server headers exist on file://). */
function offlineCsp(): Plugin {
  const csp = `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src ${METADATA_HOSTS}; worker-src blob:; base-uri 'none'; form-action 'none'`;
  return {
    name: 'evidence-offline-csp',
    transformIndexHtml(html) {
      return html
        .replace('<link rel="manifest" href="./manifest.webmanifest" />', '')
        .replace('href="./icon.svg"', `href="data:image/svg+xml;base64,${readFileSync(path.resolve(__dirname, 'public/icon.svg')).toString('base64')}"`)
        .replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />\n    <meta name="referrer" content="no-referrer" />`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const offline = mode === 'offline';
  return {
    base: './',
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    },
    plugins: [react(), tailwindcss(), ...(offline ? [viteSingleFile({ removeViteModuleLoader: true }), offlineCsp()] : [precacheServiceWorker()])],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: offline
      ? { outDir: 'dist-offline', emptyOutDir: true, assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 20_000, reportCompressedSize: false }
      : {
          rollupOptions: {
            output: {
              manualChunks(id: string) {
                if (id.includes('node_modules')) {
                  if (id.includes('pdfjs-dist') || id.includes('pdf')) return 'vendor-pdf';
                  if (id.includes('lucide-react')) return 'vendor-icons';
                  return 'vendor';
                }
              },
            },
          },
          chunkSizeWarningLimit: 1500,
        },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
