import { LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function ChatHeader() {
  const { signOut, user } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">ChatFlow</h1>
          <p className="text-xs text-muted-foreground">General Chat</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:block">{user?.email}</span>
        <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
          <LogOut className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
