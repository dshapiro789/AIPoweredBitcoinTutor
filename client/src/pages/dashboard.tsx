import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LearningProgress } from "@shared/schema";
import { LearningPathVisualizer } from "@/components/learning-path/learning-path-visualizer";
import { useTranslation } from "react-i18next";
import { Loader2, AlertCircle, BookOpen, Award, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-destructive">{t('error.failedToLoad')}</p>
        </div>
      </div>
    );
  }

  const completedExercises = progress?.reduce(
    (sum, p) => sum + p.completedExercises,
    0
  ) || 0;

  const activeTopics = progress?.length || 0;
  const averageConfidence = (progress?.reduce(
    (sum, p) => sum + p.confidenceLevel,
    0
  ) || 0) / (progress?.length || 1);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.completedExercises')}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedExercises}</div>
            <Progress 
              value={(completedExercises / (activeTopics * 5)) * 100} 
              className="h-2 mt-4" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.activeTopics')}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTopics}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('dashboard.topicsStarted')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.averageConfidence')}
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageConfidence.toFixed(1)}/5</div>
            <Progress 
              value={averageConfidence * 20} 
              className="h-2 mt-4" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Learning Path Visualizer */}
      <div className="mt-8">
        <LearningPathVisualizer userId={1} />
      </div>
    </div>
  );
}