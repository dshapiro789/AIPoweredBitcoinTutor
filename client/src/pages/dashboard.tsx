import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LearningProgress } from "@shared/schema";
import { LearningPathVisualizer } from "@/components/learning-path/learning-path-visualizer";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: progress, isLoading, error } = useQuery<LearningProgress[]>({
    queryKey: ["/api/progress/1"], // In a real app, get user ID from auth context
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        <p>{t('error.failedToLoad')}</p>
      </div>
    );
  }

  const completedExercises = progress?.reduce(
    (sum, p) => sum + p.completedExercises,
    0
  ) || 0;

  const activeTopics = progress?.length || 0;
  const averageConfidence = progress?.reduce(
    (sum, p) => sum + p.confidenceLevel,
    0
  ) / (progress?.length || 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold">{t('dashboard.title', 'Learning Dashboard')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.subtitle', 'Track your progress and continue your Bitcoin learning journey')}
        </p>
      </div>

      <LearningPathVisualizer userId={1} />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.completedExercises', 'Completed Exercises')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedExercises}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.activeTopics', 'Active Topics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeTopics}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.averageConfidence', 'Average Confidence')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{averageConfidence.toFixed(1)}/5</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}