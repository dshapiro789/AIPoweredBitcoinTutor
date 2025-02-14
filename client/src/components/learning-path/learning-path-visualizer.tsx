import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BitcoinTopic, LearningProgress } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { ChevronRight, CheckCircle2, Circle, Wand2, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LearningPathWizard } from "./learning-path-wizard";

interface LearningPathVisualizerProps {
  userId: number;
}

export function LearningPathVisualizer({ userId }: LearningPathVisualizerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);

  const { data: topics } = useQuery<BitcoinTopic[]>({
    queryKey: ["/api/bitcoin/topics"],
  });

  const { data: progress } = useQuery<LearningProgress[]>({
    queryKey: [`/api/progress/${userId}`],
  });

  const { data: personalizedPath } = useQuery({
    queryKey: [`/api/learning-path/${userId}`],
    enabled: !!progress && progress.length > 0,
  });

  if (!topics || !progress) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTopicProgress = (topicId: number) => {
    const topicProgress = progress.find(p => p.topicId === topicId);
    return topicProgress ? {
      completed: topicProgress.quizzesPassed > 0,
      score: topicProgress.totalPoints,
      confidence: topicProgress.confidenceLevel
    } : { completed: false, score: 0, confidence: 0 };
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    // Refresh all related data
    queryClient.invalidateQueries({ queryKey: [`/api/progress/${userId}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/bitcoin/topics"] });
    queryClient.invalidateQueries({ queryKey: [`/api/learning-path/${userId}`] });
  };

  if (showWizard) {
    return (
      <LearningPathWizard
        userId={userId}
        onComplete={handleWizardComplete}
      />
    );
  }

  // Sort topics based on personalized path if available
  const sortedTopics = [...topics].sort((a, b) => {
    if (!personalizedPath) return 0;
    const aIndex = personalizedPath.next_topics.findIndex(t => t.topic === a.name);
    const bIndex = personalizedPath.next_topics.findIndex(t => t.topic === b.name);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('learningPath.title')}</CardTitle>
          <CardDescription>{t('learningPath.description')}</CardDescription>
          {personalizedPath && (
            <p className="text-sm text-muted-foreground mt-2">
              <Clock className="w-4 h-4 inline mr-2" />
              {t('learningPath.estimatedTime', { time: personalizedPath.estimated_completion_time })}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-4"
          onClick={() => setShowWizard(true)}
        >
          <Wand2 className="w-4 h-4 mr-2" />
          {t('learningPath.wizard.start')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedTopics.map((topic, index) => {
            const { completed, score, confidence } = getTopicProgress(topic.id);
            const nextTopic = !completed && progress.some(p => p.quizzesPassed > 0);
            const pathInfo = personalizedPath?.next_topics.find(t => t.topic === topic.name);

            return (
              <div 
                key={topic.id}
                className={cn(
                  "relative pl-8 pb-6",
                  index !== topics.length - 1 && "border-l-2 border-muted ml-4"
                )}
              >
                <div className="absolute -left-2 top-0">
                  {completed ? (
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  ) : nextTopic ? (
                    <Circle className="w-8 h-8 text-primary animate-pulse" />
                  ) : (
                    <Circle className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>

                <Card className={cn(
                  "transition-colors",
                  completed && "border-primary",
                  nextTopic && "border-primary/50"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{topic.name}</CardTitle>
                        <CardDescription>
                          {pathInfo?.description || topic.description}
                        </CardDescription>
                        {pathInfo?.prerequisites.length > 0 && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="font-medium">Prerequisites: </span>
                            {pathInfo.prerequisites.join(", ")}
                          </div>
                        )}
                        {pathInfo?.practical_exercises.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-medium flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              Practical Exercises:
                            </p>
                            <ul className="text-sm text-muted-foreground list-disc pl-5">
                              {pathInfo.practical_exercises.map((exercise, i) => (
                                <li key={i}>{exercise}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {completed && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{t('learningPath.score')}</p>
                          <p className="text-2xl font-bold text-primary">{score}</p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {completed ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t('learningPath.confidence')}</span>
                          <span>{confidence}/5</span>
                        </div>
                        <Progress value={confidence * 20} className="h-2" />
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          {nextTopic ? t('learningPath.recommended') : t('learningPath.locked')}
                        </p>
                        <Link href={nextTopic ? `/quiz/${topic.id}` : '#'}>
                          <Button 
                            variant={nextTopic ? "default" : "outline"}
                            disabled={!nextTopic}
                          >
                            {completed ? t('learningPath.review') : t('learningPath.start')}
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}