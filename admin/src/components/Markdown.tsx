import { renderMarkdown } from '../lib/ideas.js';

// Renders marked output as HTML. Content is owner-written only (rules restrict writes to the admin),
// and PRD decision 7 keeps parity with migrated bodies: no sanitizer.
export default function Markdown({ source }: { source: string }) {
  return (
    <div
      data-testid="markdown"
      className="space-y-3 text-sm leading-relaxed [&_a]:text-teal-secondary [&_a]:underline [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_pre]:overflow-auto [&_pre]:rounded-card [&_pre]:bg-white [&_pre]:p-3 [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(source) as string }}
    />
  );
}
