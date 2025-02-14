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

  const totalSessions = progress?.reduce(
    (sum, p) => sum + p.sessionsCompleted,
    0
  ) || 0;

  const activeTopics = progress?.length || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold">{t('dashboard.title', 'Learning Dashboard')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.subtitle', 'Track your progress and continue your Bitcoin learning journey')}
        </p>
      </div>

      <LearningPathVisualizer userId={1} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.totalSessions', 'Total Sessions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSessions}</p>
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
      </div>
    </div>
  );
}