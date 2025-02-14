import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { BitcoinTopic } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Book, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TopicCardProps {
  topic: BitcoinTopic;
}

export default function TopicCard({ topic }: TopicCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-2 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="space-y-2">
            <CardTitle className="text-lg sm:text-xl mb-2 line-clamp-2">{topic.name}</CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant={topic.difficulty === "beginner" ? "secondary" : "default"} className="text-xs sm:text-sm">
                {t(`topics.difficulty.${topic.difficulty}`)}
              </Badge>
              <Badge variant="outline" className="text-xs sm:text-sm">{topic.category}</Badge>
            </div>
            <CardDescription className="text-sm sm:text-base line-clamp-3">{topic.description}</CardDescription>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link href={`/chat/${topic.id}`}>
            <Button className="w-full text-sm sm:text-base py-2" variant="default">
              <Book className="w-4 h-4 mr-2" />
              {t('topics.startLearning')}
            </Button>
          </Link>
          <Link href={`/quiz/${topic.id}`}>
            <Button className="w-full text-sm sm:text-base py-2" variant="secondary">
              <Zap className="w-4 h-4 mr-2" />
              {t('topics.takeQuiz')}
            </Button>
          </Link>
        </div>
      </CardHeader>
    </Card>
  );
}