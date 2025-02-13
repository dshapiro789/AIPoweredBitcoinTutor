import { Achievement } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
  className?: string;
  showAnimation?: boolean;
}

export function AchievementBadge({ 
  achievement, 
  unlocked = false, 
  className,
  showAnimation = false
}: AchievementBadgeProps) {
  const { t } = useTranslation();

  const badgeContent = (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        "w-12 h-12 rounded-full text-2xl",
        unlocked
          ? "bg-primary text-primary-foreground shadow-lg"
          : "bg-muted text-muted-foreground opacity-50",
        className
      )}
      title={t(achievement.name)}
    >
      {achievement.badge}
      {!unlocked && (
        <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center backdrop-blur-sm">
          🔒
        </div>
      )}
    </div>
  );

  if (showAnimation && unlocked) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
      >
        {badgeContent}
      </motion.div>
    );
  }

  return badgeContent;
}