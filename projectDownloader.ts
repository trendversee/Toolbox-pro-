import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface DownloadProgressCallback {
  (progress: { stage: string; percent: number }): void;
}

/**
 * Downloads the complete source code and project repository as a clean .zip bundle
 */
export async function downloadFullProjectZip(onProgress?: DownloadProgressCallback): Promise<void> {
  const zip = new JSZip();

  if (onProgress) onProgress({ stage: 'Collecting project files...', percent: 15 });

  // 1. Root configuration files
  zip.file(
    'package.json',
    JSON.stringify(
      {
        name: 'toolbox-pro',
        private: true,
        version: '2.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview',
        },
        dependencies: {
          '@google/genai': '^0.1.1',
          'canvas-confetti': '^1.9.4',
          'clsx': '^2.1.1',
          'file-saver': '^2.0.5',
          'firebase': '^12.10.0',
          'jszip': '^3.10.1',
          'lucide-react': '^1.16.0',
          'motion': '^12.35.0',
          'react': '^18.3.1',
          'react-dom': '^18.3.1',
          'tailwind-merge': '^3.5.0',
        },
        devDependencies: {
          '@types/canvas-confetti': '^1.9.0',
          '@types/file-saver': '^2.0.7',
          '@types/node': '^22.13.1',
          '@types/react': '^18.3.18',
          '@types/react-dom': '^18.3.5',
          '@vitejs/plugin-react': '^4.3.4',
          '@tailwindcss/vite': '^4.0.0',
          'tailwindcss': '^4.0.0',
          'typescript': '~5.7.2',
          'vite': '^6.1.0',
        },
      },
      null,
      2
    )
  );

  zip.file(
    'index.html',
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ToolBox Pro - 100+ Free Online Developer & Productivity Tools</title>
    <meta name="description" content="All-in-one suite of 100+ free online web utilities including image compressors, PDF converters, formatters, calculators, generators and security tools." />
  </head>
  <body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  );

  zip.file(
    'vite.config.ts',
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});`
  );

  zip.file(
    'tsconfig.json',
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ['src'],
      },
      null,
      2
    )
  );

  zip.file(
    'README.md',
    `# 🧰 ToolBox Pro - Complete Source Code

ToolBox Pro is a high-performance, responsive all-in-one web utility suite featuring over 100+ free online developer, media, text, math, and security tools with Google Drive cloud backup integration.

## 🚀 Getting Started

1. **Install dependencies:**
   \`\`\`bash
   npm install
   # or
   pnpm install
   # or
   bun install
   \`\`\`

2. **Start the local development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Build for production:**
   \`\`\`bash
   npm run build
   \`\`\`

4. **Preview production build:**
   \`\`\`bash
   npm run preview
   \`\`\`

## 🛠️ Features Included
- 100+ Free Online Tools across 12 Categories
- Client-Side Privacy: Tools run entirely in the browser with 0 server leaks
- Google Drive Integration for cloud project backups & file exports
- Dark & Light mode with seamless theme transitions
- Instant search with live filtering & bookmarked favorites
`
  );

  zip.file(
    '.gitignore',
    `node_modules
dist
dist-ssr
*.local
.env
.DS_Store`
  );

  if (onProgress) onProgress({ stage: 'Fetching application source code...', percent: 45 });

  // 2. Fetch all project source files dynamically via relative paths
  const sourceFilesToInclude = [
    'src/main.tsx',
    'src/App.tsx',
    'src/index.css',
    'src/types.ts',
    'src/components/Icons.tsx',
    'src/components/ToolView.tsx',
    'src/components/GoogleDriveModal.tsx',
    'src/components/DownloadModal.tsx',
    'src/components/tools/AiTools.tsx',
    'src/components/tools/CalculatorTools.tsx',
    'src/components/tools/ColorTools.tsx',
    'src/components/tools/ConverterTools.tsx',
    'src/components/tools/DevTools.tsx',
    'src/components/tools/ImageTools.tsx',
    'src/components/tools/PdfTools.tsx',
    'src/components/tools/SecurityTools.tsx',
    'src/components/tools/SeoTools.tsx',
    'src/components/tools/SocialTools.tsx',
    'src/components/tools/TextTools.tsx',
    'src/services/googleAuth.ts',
    'src/services/googleDrive.ts',
    'src/services/projectDownloader.ts',
    'src/data/categories.ts',
    'src/data/tools.ts',
    'src/utils/helpers.ts',
  ];

  for (let i = 0; i < sourceFilesToInclude.length; i++) {
    const filePath = sourceFilesToInclude[i];
    try {
      const response = await fetch(`/${filePath}`);
      if (response.ok) {
        const text = await response.text();
        zip.file(filePath, text);
      }
    } catch {
      // Fallback: continue bundling
    }
  }

  // 3. Include current user data snapshot
  if (onProgress) onProgress({ stage: 'Bundling local presets and configurations...', percent: 75 });

  const storedData: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        storedData[key] = JSON.parse(localStorage.getItem(key) || 'null');
      } catch {
        storedData[key] = localStorage.getItem(key);
      }
    }
  }

  zip.file(
    'src/data/exported-user-state.json',
    JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        localStorageSnapshot: storedData,
      },
      null,
      2
    )
  );

  if (onProgress) onProgress({ stage: 'Compiling .zip package...', percent: 90 });

  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress({
        stage: `Compressing files (${metadata.percent.toFixed(0)}%)...`,
        percent: 80 + (metadata.percent * 0.2),
      });
    }
  });

  const dateTag = new Date().toISOString().slice(0, 10);
  saveAs(zipBlob, `ToolBoxPro-Website-Source-${dateTag}.zip`);

  if (onProgress) onProgress({ stage: 'Download complete!', percent: 100 });
}

/**
 * Downloads a self-contained single offline HTML launcher with embedded data
 */
export function downloadOfflineHtml(): void {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ToolBox Pro - Offline Suite</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
    .card { background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; max-width: 600px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
    h1 { color: #818cf8; margin-top: 0; }
    p { color: #94a3b8; line-height: 1.6; }
    .btn { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🧰 ToolBox Pro Offline Suite</h1>
    <p>Your full ToolBox Pro offline archive has been downloaded. You can run the entire source code locally on any computer using Node.js & Vite with zero cloud dependencies.</p>
    <p><strong>To launch:</strong> Extract the downloaded ZIP, run <code>npm install</code> then <code>npm run dev</code>.</p>
    <a href="https://github.com" class="btn" onclick="window.print()">Print Documentation</a>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  saveAs(blob, 'ToolBoxPro-Offline-Launcher.html');
}
