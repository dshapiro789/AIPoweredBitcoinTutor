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
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-2">{topic.name}</CardTitle>
            <div className="flex gap-2 mb-2">
              <Badge variant={topic.difficulty === "beginner" ? "secondary" : "default"}>
                {topic.difficulty}
              </Badge>
              <Badge variant="outline">{topic.category}</Badge>
            </div>
            <CardDescription>{topic.description}</CardDescription>
          </div>
        </div>
        <Link href={`/chat/${topic.id}`}>
          <Button className="w-full mt-4">Start Learning</Button>
        </Link>
      </CardHeader>
    </Card>
  );
}