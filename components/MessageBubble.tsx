import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { User, Bot } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

// Pre-define plugins to ensure stability
const remarkPlugins = [remarkMath];
const rehypePlugins: any[] = [
  [rehypeKatex, { 
    strict: false, 
    output: 'html', // Generate only HTML to prevent MathML clutter
    throwOnError: false
  }]
];

// Helper to clean redundant text/math patterns like "x=5 $x=5$" -> "$x=5$"
const cleanContent = (content: string): string => {
  if (!content) return "";
  
  // Regex explanation:
  // ([^\s$=]+)   : Match a sequence of characters that aren't spaces, $, or = (to capture the equation text)
  // \s+          : Match whitespace
  // \$\1\$       : Match a literal $ followed by the EXACT same captured text, followed by $
  // This detects "5f+2s=18.50 $5f+2s=18.50$" and replaces it with "$5f+2s=18.50$"
  // We use a specific regex for the no-space algebraic equations common in this context
  let cleaned = content.replace(/([^\s$]+)\s+\$\1\$/g, '$$$1$$');
  
  // Handle slightly more complex case with internal spaces if needed, but be conservative
  // to avoid false positives.
  
  return cleaned;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Clean the content before rendering to fix the "visual clutter" redundancy bug
  const displayContent = isUser ? message.content : cleanContent(message.content);

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {isUser ? <User size={20} /> : <Bot size={20} />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`px-5 py-4 rounded-2xl shadow-sm text-sm md:text-base overflow-hidden ${
              isUser
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
            } ${message.isError ? 'bg-red-50 border-red-200 text-red-800' : ''}`}
          >
            {message.image && (
              <div className="mb-3">
                <img 
                  src={message.image} 
                  alt="Uploaded problem" 
                  className="max-w-full h-auto rounded-lg border border-slate-200/20" 
                  style={{ maxHeight: '300px' }}
                />
              </div>
            )}
            
            <div className={`prose ${isUser ? 'prose-invert' : 'prose-slate'} max-w-none break-words leading-relaxed`}>
              <ReactMarkdown
                remarkPlugins={remarkPlugins}
                rehypePlugins={rehypePlugins}
                components={{
                  // Override paragraph to avoid extra margins in tight spaces
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  // Style code blocks slightly differently
                  code: ({node, className, children, ...props}) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                       <pre className="bg-slate-900 text-slate-50 p-3 rounded-md overflow-x-auto text-xs my-2">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          </div>
          <span className="text-xs text-slate-400 mt-1 px-1">
            {isUser ? 'You' : 'AI Tutor'}
          </span>
        </div>
      </div>
    </div>
  );
};