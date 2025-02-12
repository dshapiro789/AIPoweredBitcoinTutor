import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import ChatInterface from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BitcoinTopic, ChatSession } from "@shared/schema";

export default function Chat() {
  const { topicId } = useParams();
  const { toast } = useToast();

  const { data: topic } = useQuery<BitcoinTopic>({
    queryKey: [`/api/bitcoin/topics/${topicId}`],
  });

  const { data: session, mutate: startSession } = useMutation({
    mutationFn: async () => {
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
        description: "Failed to start chat session",
        variant: "destructive",
      });
    },
  });

  if (!topic) {
    return <div>Loading topic information...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">{topic.name}</h1>
        <p className="text-muted-foreground mb-8">{topic.description}</p>
        <Button onClick={() => startSession()}>Start Session</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{topic.name}</h1>
      <ChatInterface session={session.session} subject={topic.name} />
    </div>
  );
}