import { marked } from "marked";

// Small, safe markdown → HTML for admin-authored editorial copy. gfm + line
// breaks so single newlines render. Admins are trusted, so no heavy sanitizer;
// content is short prose (bold/italic/links/lists). Works on server and client.
marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(md: string): string {
  if (!md?.trim()) return "";
  return marked.parse(md, { async: false }) as string;
}
