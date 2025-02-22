import { useQuery } from "@tanstack/react-query";
import type { BitcoinTopic, ChatSession } from "@shared/schema";
import { Bitcoin, MessageSquare, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ChatInterface from "@/components/chat-interface";

export default function Home() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: topics, isLoading, error } = useQuery<BitcoinTopic[]>({
    queryKey: ["/api/bitcoin/topics", i18n.language],
    queryFn: async () => {
      const response = await fetch(`/api/bitcoin/topics?lang=${i18n.language}`);
      if (!response.ok) throw new Error('Failed to fetch topics');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !topics?.length) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-destructive mb-4">Unable to load Bitcoin topics. Please try again later.</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            <Loader2 className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Create a default session for the home page chat with proper typing
  const defaultSession: ChatSession = {
    id: 1, // Using a number instead of string
    userId: 1,
    topicId: topics[0].id,
    messages: [
      {
        role: 'assistant',
        content: 'Hi! I\'m your AI Bitcoin tutor. What would you like to learn about today?'
      }
    ],
    isActive: true
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Development Notice */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 pb-4 flex items-center gap-2 text-primary">
            <AlertCircle className="h-5 w-5" />
            <p>
              This platform is currently in development. Feel free to explore and test out the features!
            </p>
          </CardContent>
        </Card>

        {/* Hero Section */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Bitcoin className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                {t('app.title')}
              </h1>
            </div>

            <p className="text-base sm:text-lg text-muted-foreground">
              Welcome to your personal AI Bitcoin Tutor! Ask any questions about Bitcoin, blockchain technology, 
              and cryptocurrency. I'm here to help you learn and understand these complex topics in a simple, 
              interactive way.
            </p>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <div className="mt-8">
          <ChatInterface 
            session={defaultSession}
            subject="Bitcoin Basics"
            initialMessage={null} 
          />
        </div>
      </div>
    </div>
  );
}