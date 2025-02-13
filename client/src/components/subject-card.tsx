import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { BitcoinTopic } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface TopicCardProps {
  topic: BitcoinTopic;
}

export default function TopicCard({ topic }: TopicCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-2 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="space-y-2">
            <CardTitle className="text-lg sm:text-xl mb-2 line-clamp-2">{topic.name}</CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant={topic.difficulty === "beginner" ? "secondary" : "default"} className="text-xs sm:text-sm">
                {topic.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs sm:text-sm">{topic.category}</Badge>
            </div>
            <CardDescription className="text-sm sm:text-base line-clamp-3">{topic.description}</CardDescription>
          </div>
        </div>
        <Link href={`/chat/${topic.id}`} className="block w-full">
          <Button className="w-full mt-2 sm:mt-4 text-sm sm:text-base py-2 sm:py-4">Start Learning</Button>
        </Link>
      </CardHeader>
    </Card>
  );
}