import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BitcoinTopic } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

interface ReadingMaterial {
  title: string;
  content: string;
  estimated_time: string;
}

export default function LearnPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [currentReadingIndex, setCurrentReadingIndex] = useState(0);

  const { data: topic, isLoading: topicLoading } = useQuery<BitcoinTopic>({
    queryKey: [`/api/bitcoin/topics/${topicId}`],
  });

  const { data: personalizedPath } = useQuery({
    queryKey: [`/api/learning-path/1`], // TODO: Replace with actual user ID
    enabled: !!topic,
  });

  const { data: progress } = useQuery({
    queryKey: [`/api/progress/1`], // TODO: Replace with actual user ID
    enabled: !!topic,
  });

  // Mark reading as complete
  const markReadingComplete = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/progress/update`, {
        method: 'POST',
        body: {
          userId: 1, // TODO: Replace with actual user ID
          topicId: parseInt(topicId),
          completedExercises: currentReadingIndex + 1,
          lastActive: new Date()
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/progress/1`] });
    }
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

  const pathInfo = personalizedPath?.next_topics?.find(t => t.topic === topic.name);
  const readingMaterials = (pathInfo?.reading_materials || []) as ReadingMaterial[];
  const currentReading = readingMaterials[currentReadingIndex];
  const isLastReading = currentReadingIndex === readingMaterials.length - 1;
  const hasCompletedReading = (progress?.find(p => p.topicId === parseInt(topicId))?.completedExercises || 0) >= readingMaterials.length;

  const handleNextReading = () => {
    if (isLastReading) {
      markReadingComplete.mutate();
    } else {
      setCurrentReadingIndex(prev => prev + 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{topic.name}</h1>
          <p className="text-muted-foreground">
            {pathInfo?.description || topic.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('learn.progress')}</span>
            <span>{currentReadingIndex + 1} / {readingMaterials.length}</span>
          </div>
          <Progress
            value={(currentReadingIndex + 1) / readingMaterials.length * 100}
            className="h-2"
          />
        </div>

        {/* Learning Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              {currentReading?.title}
            </CardTitle>
            <CardDescription>
              {t('learn.estimatedTime', { time: currentReading?.estimated_time + ' ' + t('learn.minutes') })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert space-y-4">
              {currentReading?.content.split('\n\n').map((section, index) => {
                if (!section.trim()) return null;

                // Handle sections with bullet points
                if (section.includes('\n-')) {
                  const [title, ...points] = section.split('\n');
                  return (
                    <div key={index}>
                      {title && <h3>{title}</h3>}
                      <ul>
                        {points.map((point, i) => (
                          <li key={i}>{point.replace('-', '').trim()}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                // Regular paragraphs
                return <p key={index}>{section}</p>;
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          <Link href={`/`}>
            <Button variant="outline">
              {t('common.back')}
            </Button>
          </Link>
          <div className="flex gap-2">
            {hasCompletedReading ? (
              <Link href={`/quiz/${topicId}`}>
                <Button className="flex items-center">
                  {t('learn.startQuiz')}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={handleNextReading}
                disabled={markReadingComplete.isPending}
                className="flex items-center"
              >
                {isLastReading ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {t('learn.complete')}
                  </>
                ) : (
                  <>
                    {t('learn.nextSection')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}