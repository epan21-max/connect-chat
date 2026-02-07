interface TypingIndicatorProps {
  typingUsers: string[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const text = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : typingUsers.length === 2
    ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
    : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;

  return (
    <div className="px-4 py-1.5 text-xs text-muted-foreground animate-in fade-in">
      <span>{text}</span>
      <span className="ml-1 inline-flex gap-0.5">
        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
      </span>
    </div>
  );
}
