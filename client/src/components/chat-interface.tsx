import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import type { ChatSession } from "@shared/schema";
import { Brain, Target, Activity, AlertTriangle } from "lucide-react";

interface ChatInterfaceProps {
  session: ChatSession;
  subject: string;
}

const INITIAL_BOT_MESSAGES = [
  {
    role: "assistant",
    content: `👋 Welcome to your Bitcoin learning journey! I'm your AI tutor, and I'm here to help you understand Bitcoin and blockchain technology.

Let's get started! Here are some topics we can explore:

1. 🌟 Bitcoin Basics
   - What is Bitcoin?
   - How does blockchain work?
   - Understanding private keys and addresses

2. 🔒 Security
   - Wallet setup and security
   - Best practices for storing Bitcoin
   - Understanding common risks

3. 💰 Transactions
   - How to send and receive Bitcoin
   - Transaction fees and confirmation
   - Understanding UTXO model

Feel free to ask any questions about these topics or tell me what interests you most!`
  }
];

export default function ChatInterface({ session, subject }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(session.messages);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (session.messages.length === 0) {
      setMessages(INITIAL_BOT_MESSAGES);
    }
  }, [session.messages.length]);

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

      if (data.message.includes("technical difficulties")) {
        setIsAIAvailable(false);
      } else {
        setIsAIAvailable(true);
      }

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 h-[calc(100vh-12rem)]">
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4">
            {!isAIAvailable && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The AI tutor is currently in fallback mode. You'll receive general guidance about Bitcoin topics.
                  We're working to restore full AI capabilities.
                </AlertDescription>
              </Alert>
            )}
            <ScrollArea className="flex-1 mb-4 pr-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground ml-8 sm:ml-12"
                        : "bg-muted mr-8 sm:mr-12"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="sticky bottom-0 bg-background pt-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isAIAvailable
                    ? "Type your question about Bitcoin..."
                    : "AI tutor is in fallback mode, but you can still ask basic questions..."}
                  className="min-h-[80px] resize-none flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={sendMessage}
                  className="sm:self-end h-10 px-6"
                >
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {analysis && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="w-5 h-5" />
                  Understanding Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={analysis.understanding * 100} className="mb-4" />
                <div className="flex flex-wrap gap-2">
                  {analysis.areas_for_improvement.map((area: string, i: number) => (
                    <Badge key={i} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
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
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5" />
                  Topic Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(analysis.confidence_by_topic).map(
                  ([topic, confidence]: [string, any], i: number) => (
                    <div key={i} className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{topic}</span>
                        <span>{Math.round(Number(confidence) * 100)}%</span>
                      </div>
                      <Progress value={Number(confidence) * 100} />
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