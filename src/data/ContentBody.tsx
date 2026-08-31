// src/data/ContentBody.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './markdownComponents';

export function ContentBody({ body }: { body: string }): React.JSX.Element | null {
  if (!body.trim()) return null;
  return (
    <div className="prose max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {body}
      </ReactMarkdown>
    </div>
  );
}
