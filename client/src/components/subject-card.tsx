import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Subject } from "@shared/schema";

interface SubjectCardProps {
  subject: Subject;
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-2">{subject.name}</CardTitle>
            <CardDescription>{subject.description}</CardDescription>
          </div>
        </div>
        <Link href={`/chat/${subject.id}`}>
          <Button className="w-full mt-4">Start Learning</Button>
        </Link>
      </CardHeader>
    </Card>
  );
}
