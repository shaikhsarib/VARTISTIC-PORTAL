/**
 * Rich-text sanitization for user-generated content.
 * Comments/descriptions are stored as plain text: all HTML tags are stripped
 * and entities escaped, so they can be rendered with React safely (never via
 * dangerouslySetInnerHTML). URLs are linkified at render time with allow-listing.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "") // strip all tags
    .replace(/\u0000/g, "");
}

/** Escape for safe storage/display (React escapes too; this protects logs/emails). */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only http(s) links allowed; returns null for anything else (javascript:, data:…). */
export function safeExternalUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
    return null;
  } catch {
    return null;
  }
}
