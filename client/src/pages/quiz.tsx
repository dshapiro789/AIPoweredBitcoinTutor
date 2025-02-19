import { useParams, useLocation } from "wouter";
import QuizComponent from "@/components/quiz-component";
import { useQuery } from "@tanstack/react-query";
import type { BitcoinTopic } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function QuizPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: topic, isLoading: topicLoading, error: topicError } = useQuery<BitcoinTopic>({
    queryKey: [`/api/bitcoin/topics/${topicId}`],
  });

  const { data: progress } = useQuery({
    queryKey: [`/api/progress/1`], // TODO: Replace with actual user ID
    enabled: !!topic,
  });

  const { data: personalizedPath } = useQuery({
    queryKey: [`/api/learning-path/1`], // TODO: Replace with actual user ID
    enabled: !!topic,
  });

  if (topicLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (topicError || !topic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-destructive mb-2">
            {t('error.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('error.failedToLoad')}
          </p>
          <Button onClick={() => setLocation('/')} className="mt-4">
            {t('common.backToHome')}
          </Button>
        </div>
      </div>
    );
  }

  const pathInfo = personalizedPath?.next_topics?.find((t: any) => t.topic === topic.name);
  const topicProgress = progress?.find((p: any) => p.topicId === parseInt(topicId));
  const hasCompletedReading = topicProgress?.completedExercises >= (pathInfo?.reading_materials?.length || 0);

  if (!hasCompletedReading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t('quiz.readingRequired')}
              </CardTitle>
              <CardDescription>
                {t('quiz.completeReadingFirst', { topic: topic.name })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/learn/${topicId}`}>
                <Button className="w-full">
                  {t('quiz.goToReading')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{topic.name} {t('quiz.title')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('quiz.description', { topic: topic.name.toLowerCase() })}
        </p>
      </div>

      <QuizComponent
        topicId={parseInt(topicId)}
        userId={1} // TODO: Replace with actual user ID
      />
    </div>
  );
}