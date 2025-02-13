import { useQuery } from "@tanstack/react-query";
import { Achievement, UserAchievement } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AchievementBadge } from "./achievement-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

interface AchievementsListProps {
  userId: number;
}

export function AchievementsList({ userId }: AchievementsListProps) {
  const { t } = useTranslation();
  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: userAchievements } = useQuery<(UserAchievement & { achievement: Achievement })[]>({
    queryKey: ["/api/achievements", userId],
  });

  if (!achievements) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('achievements.title', 'Achievements')}</CardTitle>
        <CardDescription>
          {t('achievements.description', 'Complete learning milestones to earn badges')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {achievements.map((achievement) => {
              const unlocked = userAchievements?.some(
                (ua) => ua.achievementId === achievement.id
              );
              const userAchievement = userAchievements?.find(
                (ua) => ua.achievementId === achievement.id
              );

              return (
                <div
                  key={achievement.id}
                  className="flex items-center gap-4 p-2 rounded-lg transition-colors hover:bg-muted/50"
                >
                  <AchievementBadge achievement={achievement} unlocked={unlocked} />
                  <div className="flex-1">
                    <h4 className="font-semibold">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {unlocked && userAchievement && (
                      <p className="text-xs text-primary mt-1">
                        {t('achievements.unlocked', 'Unlocked')}:{' '}
                        {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {unlocked && (
                    <div className="text-sm font-medium text-primary">
                      +{achievement.points} {t('achievements.points', 'points')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
