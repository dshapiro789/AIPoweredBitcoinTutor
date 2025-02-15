import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import ChatInterface from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BitcoinTopic, ChatSession } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function Chat() {
  const { topicId } = useParams<{ topicId: string }>();
  const [location] = useLocation();
  const { toast } = useToast();

  // Extract initial message from URL if present
  const initialMessage = new URLSearchParams(location.split('?')[1]).get('message');

  const { data: topic, isLoading: topicLoading } = useQuery<BitcoinTopic>({
    queryKey: [`/api/bitcoin/topics/${topicId}`],
    enabled: !!topicId
  });

  const { data: session, isLoading: sessionLoading, mutate: startSession } = useMutation({
    mutationFn: async () => {
      if (!topicId) throw new Error("Topic ID is required");
      const response = await apiRequest("POST", "/api/chat/start", {
        userId: 1, // In a real app, get from auth context
        topicId: parseInt(topicId),
        messages: [],
        isActive: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bitcoin/topics/${topicId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start chat session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-start session if we have an initial message
  useEffect(() => {
    if (initialMessage && !session && !sessionLoading) {
      startSession();
    }
  }, [initialMessage, session, sessionLoading]);

  if (topicLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Topic Not Found</h1>
        <p className="text-muted-foreground">The requested topic could not be found.</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">{topic.name}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{topic.description}</p>
        </div>
        <Button 
          size="lg"
          onClick={() => startSession()}
          className="animate-pulse"
        >
          Start Learning Session
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">{topic.name}</h1>
      <ChatInterface 
        session={session.session} 
        subject={topic.name} 
        initialMessage={initialMessage}
      />
    </div>
  );
}