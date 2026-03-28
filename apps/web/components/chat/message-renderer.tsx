import Link from "next/link";
import { CheckSquare, User, Hash } from "lucide-react";

export function MessageRenderer({ content, workspaceId }: { content: string, workspaceId: string }) {
  // Regex to match our exact syntax: @[Title](type:id)
  const mentionRegex = /@\[([^\]]+)\]\((user|project|task):([^)]+)\)/g;

  // Split the string into an array of text chunks and mention objects
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Push the normal text before the mention
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    const title = match[1];
    const type = match[2];
    const id = match[3];

    // Determine colors and links based on type
    const isUser = type === "user";
    const isTask = type === "task";
    
    const Icon = isUser ? User : isTask ? CheckSquare : Hash;
    const colorClass = isUser ? "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20" 
                     : isTask ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
                     : "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20";
    
    const url = `/dashboard/${workspaceId}/${type}s/${id}`;

    parts.push(
      <Link 
        key={match.index} 
        href={url}
        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border align-middle text-[12px] font-semibold transition-colors mx-1 ${colorClass}`}
      >
        <Icon className="h-3 w-3" />
        {title}
      </Link>
    );

    lastIndex = mentionRegex.lastIndex;
  }

  // Push any remaining normal text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  // If there are no mentions, just return the text!
  if (parts.length === 0) {
    return <p className="text-sm whitespace-pre-wrap">{content}</p>;
  }

  return <p className="text-sm whitespace-pre-wrap leading-relaxed">{parts}</p>;
}