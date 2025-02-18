import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatSession } from "@shared/schema";
import { Brain, AlertTriangle, Send } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  session: ChatSession;
  subject: string;
  initialMessage?: string | null;
}

export default function ChatInterface({ session, subject, initialMessage }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [sessionStartTime] = useState(new Date());

  useEffect(() => {
    const updateProgress = async () => {
      const timeSpent = (new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60; // in minutes
      const messageCount = messages.filter(m => m.role === 'user').length;

      try {
        await apiRequest("POST", "/api/progress/update", {
          userId: session.userId,
          topicId: session.topicId,
          completedExercises: Math.floor(messageCount / 2), // Consider every 2 messages as a completed exercise
          confidenceLevel: analysis?.confidence_level || 1,
          quizzesPassed: 0,
          totalPoints: Math.floor(timeSpent) + (messageCount * 10), // Points based on time and interaction
          lastActive: new Date(),
        });

        queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      } catch (error) {
        console.error("Failed to update progress:", error);
      }
    };

    const progressInterval = setInterval(updateProgress, 5 * 60 * 1000);
    return () => clearInterval(progressInterval);
  }, [session.userId, session.topicId, messages.length, analysis, sessionStartTime]);

  useEffect(() => {
    const initialMessages: Message[] = session.messages.length > 0
      ? session.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: typeof msg.content === 'string' ? msg.content : '',
          timestamp: new Date()
        }))
      : [{
          role: 'assistant',
          content: `👋 Welcome to your Bitcoin learning journey! I'm your AI tutor, and I'm here to help you understand Bitcoin and blockchain technology.
\n\nLet's get started! Here are some topics we can explore:
\n\n1. 🌟 Bitcoin Basics
   - What is Bitcoin?
   - How does blockchain work?
   - Understanding private keys and addresses
\n\n2. 🔒 Security
   - Wallet setup and security
   - Best practices for storing Bitcoin
   - Understanding common risks
\n\n3. 💰 Transactions
   - How to send and receive Bitcoin
   - Transaction fees and confirmation
   - Understanding UTXO model
\n\nPlease note: I'm specifically designed to help you learn about Bitcoin and blockchain technology. For other topics, please consult appropriate resources.`,
          timestamp: new Date()
        }];

    setMessages(initialMessages);

    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
  }, [session.messages.length, initialMessage]);

  const isBitcoinRelated = (text: string): boolean => {
    const bitcoinKeywords = [
      'bitcoin', 'btc', 'blockchain', 'crypto', 'wallet', 'mining', 'block',
      'transaction', 'satoshi', 'nakamoto', 'node', 'lightning', 'network',
      'private key', 'public key', 'address', 'hash', 'cryptocurrency',
      'mempool', 'utxo', 'segwit', 'halving', 'fork'
    ];
    const lowercaseText = text.toLowerCase();
    return bitcoinKeywords.some(keyword => lowercaseText.includes(keyword));
  };

  const handleSendMessage = async (messageToSend: string) => {
    if (!messageToSend.trim()) return;

    if (!isBitcoinRelated(messageToSend)) {
      toast({
        title: "Off-topic Question",
        description: "Please ask questions related to Bitcoin and blockchain technology. For other topics, please use appropriate resources.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userMessage: Message = {
        role: 'user',
        content: messageToSend.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setMessage(""); 

      const response = await apiRequest("POST", "/api/chat/message", {
        sessionId: session.id,
        message: messageToSend.trim(),
        subject,
        userId: session.userId,
      });

      const data = await response.json();

      if (data.message.includes("technical difficulties")) {
        setIsAIAvailable(false);
      } else {
        setIsAIAvailable(true);
      }

      const assistantMessage: Message = {
        role: 'assistant',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(message);
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)]">
      <CardContent className="flex flex-col h-full p-0">
        {!isAIAvailable && (
          <Alert className="m-4 mb-0">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('chat.fallbackMode', 'The AI tutor is currently in fallback mode. You\'ll receive general guidance about Bitcoin topics. We\'re working to restore full AI capabilities.')}
            </AlertDescription>
          </Alert>
        )}

        {analysis && (
          <div className="px-4 py-2 bg-muted/50 border-b">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4" />
              <span>Learning Progress</span>
            </div>
            <Progress 
              value={analysis.progress * 100} 
              className="h-2 mt-2"
            />
          </div>
        )}

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 py-4">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
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
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('chat.inputPlaceholder', 'Type your question about Bitcoin...')}
              className="min-h-[44px] max-h-[160px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full"
              disabled={!message.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}