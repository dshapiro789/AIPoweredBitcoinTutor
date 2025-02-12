import { useQuery } from "@tanstack/react-query";
import SubjectCard from "@/components/subject-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Subject } from "@shared/schema";

export default function Home() {
  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Welcome to AI Tutor</h1>
        <p className="text-muted-foreground">
          Choose a subject below to start learning with your personal AI tutor.
          Get instant feedback and guidance tailored to your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects?.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </div>
    </div>
  );
}
