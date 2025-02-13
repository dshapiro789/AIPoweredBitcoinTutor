import { useQuery } from "@tanstack/react-query";
import TopicCard from "@/components/subject-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BitcoinTopic } from "@shared/schema";
import { Bitcoin } from "lucide-react";

export default function Home() {
  const { data: topics, isLoading } = useQuery<BitcoinTopic[]>({
    queryKey: ["/api/bitcoin/topics"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 sm:space-y-8">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Bitcoin className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">The AI-Powered Bitcoin Tutor</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Start your Bitcoin journey with our AI-powered tutor. From basics to advanced concepts,
          learn how to securely store, manage, and transact with Bitcoin through interactive
          lessons tailored to your level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {topics?.map((topic) => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  );
}