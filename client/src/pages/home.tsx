import { useQuery } from "@tanstack/react-query";
import TopicCard from "@/components/subject-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BitcoinTopic } from "@shared/schema";
import { Bitcoin, MessageSquare, Book } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { t, i18n } = useTranslation();
  const { data: topics, isLoading } = useQuery<BitcoinTopic[]>({
    queryKey: ["/api/bitcoin/topics", i18n.language],
    queryFn: async () => {
      const response = await fetch(`/api/bitcoin/topics?lang=${i18n.language}`);
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Section */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Bitcoin className="w-10 h-10 text-primary" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {t('app.title')}
                </h1>
              </div>

              <p className="text-lg text-muted-foreground max-w-2xl">
                {t('app.description')}
              </p>

              <Link href="/chat/start">
                <Button size="lg" className="mt-6">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  {t('topics.startLearning')}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Featured Topics or Recent Progress */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Book className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-semibold">{t('nav.subjects')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topics?.slice(0, 4).map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-4">
          <div className="sticky top-4">
            <h2 className="text-xl font-semibold mb-4">{t('quiz.title')}</h2>
            <div className="space-y-4">
              {topics?.map((topic) => (
                <Card key={topic.id} className="transition-colors hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">{topic.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {topic.description}
                      </p>
                      <Link href={`/quiz/${topic.id}`}>
                        <Button variant="outline" className="w-full mt-2">
                          {t('topics.takeQuiz')}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}