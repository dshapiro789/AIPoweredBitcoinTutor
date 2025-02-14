import { useQuery } from "@tanstack/react-query";
import { BitcoinTopic, LearningProgress } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface LearningPathVisualizerProps {
  userId: number;
}

export function LearningPathVisualizer({ userId }: LearningPathVisualizerProps) {
  const { t } = useTranslation();

  const { data: topics } = useQuery<BitcoinTopic[]>({
    queryKey: ["/api/bitcoin/topics"],
  });

  const { data: progress } = useQuery<LearningProgress[]>({
    queryKey: [`/api/progress/${userId}`],
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('learningPath.title')}</CardTitle>
        <CardDescription>{t('learningPath.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topics.map((topic, index) => {
            const { completed, score, confidence } = getTopicProgress(topic.id);
            const nextTopic = !completed && progress.some(p => p.quizzesPassed > 0);
            
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
                        <CardDescription>{topic.description}</CardDescription>
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
