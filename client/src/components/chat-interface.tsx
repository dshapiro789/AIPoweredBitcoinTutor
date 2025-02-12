import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import type { ChatSession } from "@shared/schema";

interface ChatInterfaceProps {
  session: ChatSession;
  subject: string;
}

export default function ChatInterface({ session, subject }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(session.messages);
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const response = await apiRequest("POST", "/api/chat/message", {
        sessionId: session.id,
        message: message.trim(),
        subject,
        userId: session.userId,
      });
      
      const data = await response.json();
      
      setMessages([
        ...messages,
        { role: "user", content: message },
        { role: "assistant", content: data.message },
      ]);
      setMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-lg p-4">
      <ScrollArea className="flex-1 mb-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground ml-12"
                  : "bg-muted mr-12"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}
