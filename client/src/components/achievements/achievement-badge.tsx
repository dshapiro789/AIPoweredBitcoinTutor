import { Achievement } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
  className?: string;
}

export function AchievementBadge({ achievement, unlocked = false, className }: AchievementBadgeProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        "w-12 h-12 rounded-full text-2xl",
        unlocked
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground opacity-50",
        className
      )}
      title={achievement.name}
    >
      {achievement.badge}
      {!unlocked && (
        <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
          🔒
        </div>
      )}
    </div>
  );
}
