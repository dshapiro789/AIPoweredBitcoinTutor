import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import ChatInterface from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import type { Subject, ChatSession } from "@shared/schema";

export default function Chat() {
  const { subjectId } = useParams();
  const { toast } = useToast();

  const { data: subject } = useQuery<Subject>({
    queryKey: [`/api/subjects/${subjectId}`],
  });

  const { data: session, mutate: startSession } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chat/start", {
        userId: 1, // In a real app, get from auth context
        subjectId: parseInt(subjectId),
        messages: [],
        isActive: true,
      });
      return response.json();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start chat session",
        variant: "destructive",
      });
    },
  });

  if (!subject) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">{subject.name}</h1>
        <p className="text-muted-foreground mb-8">{subject.description}</p>
        <Button onClick={() => startSession()}>Start Session</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{subject.name}</h1>
      <ChatInterface session={session} subject={subject.name} />
    </div>
  );
}
