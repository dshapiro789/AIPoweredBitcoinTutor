import { useQuery } from "@tanstack/react-query";
import ProgressChart from "@/components/progress-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Progress } from "@shared/schema";

export default function Dashboard() {
  const { data: progress } = useQuery<Progress[]>({
    queryKey: ["/api/progress/1"], // In a real app, get user ID from auth context
  });

  if (!progress) {
    return <div>Loading...</div>;
  }

  const totalSessions = progress.reduce(
    (sum, p) => sum + p.sessionsCompleted,
    0
  );

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Learning Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSessions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{progress.length}</p>
          </CardContent>
        </Card>
      </div>

      <ProgressChart progress={progress} />
    </div>
  );
}
