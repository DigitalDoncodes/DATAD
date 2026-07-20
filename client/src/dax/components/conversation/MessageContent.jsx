import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { remarkPlugins, rehypePlugins, buildComponents } from '../../lib/markdown.jsx';
import CodeBlock from './CodeBlock';
import StreamingCaret from './StreamingCaret';

export default function MessageContent({ content, isStreaming }) {
  const components = useMemo(
    () => buildComponents({ isStreaming, CodeBlock }),
    // Re-parse only when the message settles or its length changes —
    // never on every single streaming tick beyond what content actually changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStreaming]
  );

  return (
    <div className="dax-prose text-[15px] leading-relaxed text-[var(--dax-text)]">
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
        {content}
      </ReactMarkdown>
      {isStreaming && <StreamingCaret />}
    </div>
  );
}
