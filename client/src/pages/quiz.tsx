import { useParams } from "wouter";
import QuizComponent from "@/components/quiz-component";
import { useQuery } from "@tanstack/react-query";
import type { BitcoinTopic } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function QuizPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const { t } = useTranslation();

  const { data: topic, isLoading } = useQuery<BitcoinTopic>({
    queryKey: [`/api/bitcoin/topics/${topicId}`],
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