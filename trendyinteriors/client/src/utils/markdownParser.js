/**
 * Simple markdown parser for basic formatting
 * Handles: **bold**, *italic*, links [text](url)
 */

export const parseMarkdown = (text) => {
  if (!text) return text;

  // This will be used with dangerouslySetInnerHTML, so we need to escape HTML
  let html = text
    // Escape HTML special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Parse **bold**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Parse *italic* or _italic_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Parse [link](url)
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Parse line breaks
    .replace(/\n/g, '<br/>');

  return html;
};

export const MarkdownText = ({ children }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: parseMarkdown(children)
      }}
      style={{ wordBreak: 'break-word' }}
    />
  );
};

export default MarkdownText;
