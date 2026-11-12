// Artifacts: runnable code a reply carries, shown in a side panel with a live
// preview next to the source — the pattern Claude's Artifacts panel made
// familiar (a sandboxed iframe for the preview, tabs for code and preview,
// copy and download in the header). This module is the pure half: finding the
// artifacts in a Markdown reply and building the document the iframe runs.

export type ArtifactKind = 'html' | 'svg'

export interface Artifact {
  /** Stable within a message: `${messageIndex}:${blockIndex}`. */
  id: string
  kind: ArtifactKind
  /** Fence language as written, lowercased ('' when the fence had none). */
  language: string
  code: string
  /** <title> / <svg title> when present, else a kind label chosen by the caller. */
  title: string | null
  filename: string
}

const FENCE = /^([ \t]{0,3})(`{3,}|~{3,})[ \t]*([^\s`]*)[^\n]*\n([\s\S]*?)\n[ \t]{0,3}\2[ \t]*$/gm

/** Is this fenced block something a browser can run on its own? */
export function artifactKindOf(language: string, code: string): ArtifactKind | null {
  const lang = language.toLowerCase()
  const head = code.slice(0, 400).trimStart().toLowerCase()
  if (lang === 'svg' || (head.startsWith('<svg') && (lang === '' || lang === 'xml' || lang === 'html'))) return 'svg'
  if (lang === 'html' || lang === 'htm' || lang === 'xhtml') return 'html'
  if ((lang === '' || lang === 'xml' || lang === 'markup') && (head.startsWith('<!doctype html') || head.startsWith('<html'))) return 'html'
  return null
}

function titleOf(kind: ArtifactKind, code: string): string | null {
  const m = kind === 'html'
    ? /<title[^>]*>([^<]{1,120})<\/title>/i.exec(code)
    : /<title[^>]*>([^<]{1,120})<\/title>/i.exec(code)
  const t = m?.[1]?.trim()
  return t ? t : null
}

/** Every runnable fenced block in a Markdown reply, in document order.
 *  A fence still open (streaming) is not matched, so a card only appears
 *  once the block has closed. */
export function extractArtifacts(markdown: string, messageIndex = 0): Artifact[] {
  const out: Artifact[] = []
  let block = 0
  for (const m of markdown.matchAll(FENCE)) {
    const language = (m[3] ?? '').toLowerCase()
    const code = m[4] ?? ''
    block += 1
    const kind = artifactKindOf(language, code)
    if (!kind) continue
    out.push({
      id: `${messageIndex}:${block}`,
      kind,
      language,
      code,
      title: titleOf(kind, code),
      filename: kind === 'svg' ? `artifact-${block}.svg` : `artifact-${block}.html`,
    })
  }
  return out
}

export function artifactSrcDoc(artifact: Artifact): string {
  if (artifact.kind === 'svg') {
    return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:#0f0f0f}body{display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}svg{max-width:100%;max-height:100%}</style></head><body>${artifact.code}</body></html>`
  }

  let code = artifact.code.trim();
  const hasHtml = code.includes('<html') || code.includes('<!DOCTYPE') || code.includes('<!doctype');

  const cdnHead = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      :root {
        color-scheme: dark;
      }
      html, body {
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        margin: 0;
        background-color: #0b0f19;
        color: #f3f4f6;
        -webkit-font-smoothing: antialiased;
      }
      /* Modern baseline fixes to prevent raw unstyled 1990s look */
      a { color: inherit; text-decoration: none; }
      input, select, textarea, button { font-family: inherit; }
      input[type="text"], input[type="search"], textarea {
        background-color: #1e293b;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        outline: none;
      }
      input[type="text"]:focus, input[type="search"]:focus, textarea:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
      }
      button {
        cursor: pointer;
        transition: all 0.2s ease;
      }
      /* Custom modern scrollbars */
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: #0b0f19; }
      ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #475569; }
    </style>
  `;

  if (!hasHtml) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${artifact.title || 'Live Preview'}</title>
  ${cdnHead}
</head>
<body class="bg-[#0b0f19] text-[#f3f4f6] min-h-screen p-4 antialiased selection:bg-indigo-500 selection:text-white">
  ${code}
</body>
</html>`;
  }

  if (code.includes('</head>')) {
    code = code.replace('</head>', `${cdnHead}\n</head>`);
  } else {
    code = code.replace(/<html[^>]*>/i, `$&<head>${cdnHead}</head>`);
  }

  return code;
}

/** Sandbox flags for the preview: scripts may run (a page without JS is not
 *  much of a preview) but the frame is a separate origin with no access to
 *  the dashboard, its storage or its session. Never add allow-same-origin. */
export const ARTIFACT_SANDBOX = 'allow-scripts allow-forms allow-modals allow-popups allow-pointer-lock'

export function artifactMimeType(kind: ArtifactKind): string {
  return kind === 'svg' ? 'image/svg+xml' : 'text/html'
}
