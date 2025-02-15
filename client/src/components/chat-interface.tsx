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
import { Brain, Target, Activity, AlertTriangle, Send, ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

Feel free to ask any questions about these topics or tell me what interests you most!`,
    timestamp: new Date()
  }
];

export default function ChatInterface({ session, subject }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(session.messages.map(msg => ({ ...msg, timestamp: new Date() })));
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (session.messages.length === 0) {
      setMessages(INITIAL_BOT_MESSAGES);
    }
  }, [session.messages.length]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const userMessage = {
        role: "user",
        content: message.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setMessage("");

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

      const assistantMessage = {
        role: "assistant",
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setAnalysis(data.analysis);
    } catch (error) {
      toast({
        title: t('error.title', 'Error'),
        description: t('error.sendMessage', 'Failed to send message'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-4rem)]">
      <div className="lg:col-span-2">
        <Card className="flex flex-col h-full">
          <CardContent className="flex flex-col h-full p-0">
            {!isAIAvailable && (
              <Alert className="m-4 mb-0">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('chat.fallbackMode', 'The AI tutor is currently in fallback mode. You\'ll receive general guidance about Bitcoin topics. We\'re working to restore full AI capabilities.')}
                </AlertDescription>
              </Alert>
            )}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-6 py-4">
                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  const showTimestamp = i === 0 ||
                    new Date(messages[i - 1].timestamp).getTime() - new Date(msg.timestamp).getTime() > 300000;

                  return (
                    <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      {showTimestamp && (
                        <div className="text-xs text-muted-foreground mb-2 px-2">
                          {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                        </div>
                      )}
                      <div
                        className={`relative max-w-[85%] p-4 rounded-2xl ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted rounded-bl-none"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words text-sm sm:text-base">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="sticky bottom-0 border-t bg-background p-4">
              <div className="flex items-end gap-2 max-w-5xl mx-auto">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isAIAvailable
                    ? t('chat.inputPlaceholder', 'Type your question about Bitcoin...')
                    : t('chat.inputPlaceholderFallback', 'AI tutor is in fallback mode, but you can still ask basic questions...')}
                  className="min-h-[44px] max-h-[160px] resize-none rounded-full px-4 py-3"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-full"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Panel - Collapsible on Mobile */}
      <div className="lg:block">
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
            className="w-full flex items-center justify-between"
          >
            {t('chat.analysis', 'Learning Analysis')}
            {isAnalysisExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <div className={`space-y-4 ${isAnalysisExpanded ? 'block' : 'hidden lg:block'}`}>
          {analysis && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5" />
                    {t('chat.understanding', 'Understanding Level')}
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
                    {t('chat.nextTopics', 'Next Topics')}
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
                    {t('chat.confidence', 'Topic Confidence')}
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
    </div>
  );
}