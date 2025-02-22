import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BitcoinTopic } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronRight, BookOpen, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LearnPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentReadingIndex, setCurrentReadingIndex] = useState(0);

  const { data: topic, isLoading: topicLoading, error: topicError } = useQuery<BitcoinTopic>({
    queryKey: [`/api/bitcoin/topics/${topicId}`],
    retry: 2,
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t('error.loadingFailed'),
        description: error instanceof Error ? error.message : t('error.unknown'),
      });
    }
  });

  const { data: personalizedPath, isLoading: pathLoading } = useQuery({
    queryKey: [`/api/learning-path/1`], // TODO: Replace with actual user ID
    enabled: !!topic,
    retry: 2,
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: [`/api/progress/1`], // TODO: Replace with actual user ID
    enabled: !!topic,
    retry: 2,
  });

  // Updated mutation implementation with better error handling
  const markReadingComplete = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // TODO: Replace with actual user ID
          topicId: parseInt(topicId),
          completedExercises: currentReadingIndex + 1,
          lastActive: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update progress');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/progress/1`] });
      setLocation(`/quiz/${topicId}`);
      toast({
        title: t('learn.complete'),
        description: t('quiz.startDescription'),
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t('error.title'),
        description: error instanceof Error ? error.message : t('error.unknown'),
      });
    }
  });

  // Loading state with skeleton UI
  if (topicLoading || pathLoading || progressLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (topicError || !topic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-3xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('error.failedToLoad')}
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('error.tryAgain')}
          </Button>
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
              {t('learn.estimatedTime', { time: currentReading?.estimated_time })}
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
                      {title && title.trim() && (
                        <h3 className={
                          title.includes("Key Points") || title.includes("How Bitcoin Works")
                            ? "text-lg font-semibold text-primary mt-6 mb-4"
                            : undefined
                        }>
                          {title}
                        </h3>
                      )}
                      <ul className="space-y-2">
                        {points
                          .filter(point => point.trim())
                          .map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="select-none">•</span>
                              <span>{point.replace('-', '').trim()}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  );
                }

                // Regular paragraphs
                return section.trim() && (
                  <p key={index} className="leading-relaxed">
                    {section}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          <Link href="/">
            <Button variant="outline">
              {t('learn.back')}
            </Button>
          </Link>
          <Button
            onClick={() => markReadingComplete.mutate()}
            disabled={markReadingComplete.isPending}
            className="flex items-center gap-2"
          >
            {markReadingComplete.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {markReadingComplete.isPending ? t('common.generating') : t('learn.complete')}
          </Button>
        </div>
      </div>
    </div>
  );
}