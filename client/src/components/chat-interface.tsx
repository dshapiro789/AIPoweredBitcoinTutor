import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import type { ChatSession } from "@shared/schema";
import { BookOpen, Brain, Target, Activity } from "lucide-react";

interface ChatInterfaceProps {
  session: ChatSession;
  subject: string;
}

export default function ChatInterface({ session, subject }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(session.messages);
  const [analysis, setAnalysis] = useState<any>(null);
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
      setAnalysis(data.analysis);
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
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <Card className="h-[600px]">
          <CardContent className="p-4">
            <ScrollArea className="h-[500px] mb-4">
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
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {analysis && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Understanding Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={analysis.understanding * 20} className="mb-2" />
                <div className="space-y-2">
                  {analysis.areas_for_improvement.map((area: string, i: number) => (
                    <Badge key={i} variant="outline" className="mr-2">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Next Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {analysis.recommended_topics.map((topic: string, i: number) => (
                    <li key={i} className="text-sm">
                      {topic}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Topic Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(analysis.confidence_by_topic).map(
                  ([topic, confidence]: [string, number], i: number) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{topic}</span>
                        <span>{Math.round(confidence * 100)}%</span>
                      </div>
                      <Progress value={confidence * 100} />
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}