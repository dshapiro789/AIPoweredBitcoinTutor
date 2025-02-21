import { useParams } from "wouter";
import QuizComponent from "@/components/quiz-component";
import { useQuery } from "@tanstack/react-query";
import type { BitcoinTopic } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function QuizPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const { t, i18n } = useTranslation();

  const { data: topic, isLoading, error } = useQuery<BitcoinTopic>({
    queryKey: [`/api/bitcoin/topics/${topicId}`, i18n.language],
    queryFn: async () => {
      const response = await fetch(`/api/bitcoin/topics/${topicId}?lang=${i18n.language}`);
      if (!response.ok) throw new Error('Failed to load topic');
      return response.json();
    }
  });

  if (isLoading || !topic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-destructive mb-2">
            {t('error.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('error.failedToLoad')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{topic.name} {t('quiz.title')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('topics.takeQuiz')} - {topic.name.toLowerCase()}.
        </p>
      </div>

      <QuizComponent topicId={parseInt(topicId)} userId={1} />
    </div>
  );
}