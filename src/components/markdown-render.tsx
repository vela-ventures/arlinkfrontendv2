import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGemoji from "remark-gemoji";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

const MarkdownRender = ({
    content,
    isLoading,
    error,
    title,
}: {
    content: string;
    isLoading: boolean;
    error: string;
    title: string;
}) => {
    if (isLoading) {
        return (
            <div className="mt-8 space-y-4 animate-pulse">
                <div className="h-8 bg-neutral-800 rounded w-2/3"></div>
                <div className="h-4 bg-neutral-800 rounded w-full"></div>
                <div className="h-4 bg-neutral-800 rounded w-5/6"></div>
                <div className="h-4 bg-neutral-800 rounded w-4/6"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-8 bg-red-900/20 border border-red-900/50 rounded-lg p-4 text-red-400">
                Failed to load README content. Please try again later.
            </div>
        );
    }

    if (!content) {
        return (
            <div className="mt-8 bg-neutral-900 rounded-lg p-4 text-neutral-400">
                No README content available for this template.
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
            <div className="prose prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent">
                <ReactMarkdown
                    className="markdown"
                    remarkPlugins={[remarkGfm, remarkGemoji]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        code({ node, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(
                                className || "",
                            );
                            return match ? (
                                <SyntaxHighlighter
                                    // @ts-ignore
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-lg !my-4"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                            ) : (
                                <code
                                    className="bg-neutral-800 px-1.5 py-0.5 rounded text-sm"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        },

                        a: ({ node, ...props }) => (
                            <a
                                className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props}
                            />
                        ),
                        ul: ({ node, ...props }) => (
                            <ul
                                className="list-disc marker:text-neutral-500"
                                {...props}
                            />
                        ),
                        ol: ({ node, ...props }) => (
                            <ol
                                className="list-decimal marker:text-neutral-500"
                                {...props}
                            />
                        ),
                        h1: ({ node, ...props }) => (
                            <h1
                                className="text-3xl font-bold mt-8 mb-4"
                                {...props}
                            />
                        ),
                        h2: ({ node, ...props }) => (
                            <h2
                                className="text-2xl font-semibold mt-8 mb-4"
                                {...props}
                            />
                        ),
                        h3: ({ node, ...props }) => (
                            <h3
                                className="text-xl font-semibold mt-6 mb-4"
                                {...props}
                            />
                        ),
                        p: ({ node, ...props }) => (
                            <p className="my-4 leading-7" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                            <blockquote
                                className="border-l-4 border-neutral-700 pl-4 italic text-neutral-400"
                                {...props}
                            />
                        ),
                        table: ({ node, ...props }) => (
                            <div className="my-4 overflow-x-auto">
                                <table
                                    className="min-w-full divide-y divide-neutral-800"
                                    {...props}
                                />
                            </div>
                        ),
                        th: ({ node, ...props }) => (
                            <th
                                className="px-4 py-2 bg-neutral-900 font-semibold"
                                {...props}
                            />
                        ),
                        td: ({ node, ...props }) => (
                            <td
                                className="px-4 py-2 border-b border-neutral-800"
                                {...props}
                            />
                        ),
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default MarkdownRender;
