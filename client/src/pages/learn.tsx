import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { BitcoinTopic } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronRight, BookOpen, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearnPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const { t } = useTranslation();

  const { data: topic, isLoading: topicLoading } = useQuery<BitcoinTopic>({
    queryKey: [`/api/bitcoin/topics/${topicId}`],
  });

  const { data: personalizedPath } = useQuery({
    queryKey: [`/api/learning-path/1`], // TODO: Replace with actual user ID
    enabled: !!topic,
  });

  if (topicLoading || !topic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const pathInfo = personalizedPath?.next_topics.find(t => t.topic === topic.name);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{topic.name}</h1>
          <p className="text-muted-foreground">
            {pathInfo?.description || topic.description}
          </p>
        </div>

        {/* Learning Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              {t('learn.content')}
            </CardTitle>
            <CardDescription>
              {t('learn.followPath')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pathInfo?.practical_exercises.map((exercise, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Play className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{exercise}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('learn.exerciseDescription', { number: index + 1 })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          <Link href={`/`}>
            <Button variant="outline">
              {t('common.back')}
            </Button>
          </Link>
          <Link href={`/quiz/${topicId}`}>
            <Button className="flex items-center">
              {t('learn.startQuiz')}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
