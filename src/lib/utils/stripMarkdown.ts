/**
 * Strip markdown formatting from AI responses for clean display.
 * Converts markdown to plain readable text.
 */
export function stripMarkdown(text: string): string {
  return text
    // Remove markdown tables entirely — replace with a clean summary line
    .replace(/\|[^\n]+\|\n\|[-| :]+\|\n((\|[^\n]+\|\n?)*)/g, (match) => {
      // Extract table rows as plain text
      const rows = match.split('\n').filter(r => r.trim() && !r.match(/^[\s|:-]+$/));
      return rows.map(r =>
        r.replace(/\|/g, '').replace(/\s{2,}/g, ' ').trim()
      ).filter(Boolean).join('\n') + '\n';
    })
    // Remove heading markers (## ### ####)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic (**text**, *text*, __text__, _text_)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove inline code `code`
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks ```...```
    .replace(/```[\s\S]*?```/g, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove blockquotes >
    .replace(/^>\s*/gm, '')
    // Remove bullet list markers (- item, * item, + item)
    .replace(/^[\s]*[-*+]\s+/gm, '• ')
    // Remove numbered list markers (1. item)
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove link syntax [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove image syntax ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Collapse 3+ newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
