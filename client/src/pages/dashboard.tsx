import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BitcoinTopic } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Loader2, AlertCircle, Book } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: topics, isLoading, error } = useQuery<BitcoinTopic[]>({
    queryKey: ["/api/bitcoin/topics"],
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-destructive">{t('error.failedToLoad')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Library Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold">{t('library.title')}</h1>
        <p className="text-muted-foreground">
          {t('library.subtitle')}
        </p>
      </div>

      {/* Topics Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {topics?.map((topic) => (
          <Card key={topic.id} className="transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                {topic.name}
              </CardTitle>
              <CardDescription>
                {topic.description}
              </CardDescription>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {t(`topics.difficulty.${topic.difficulty.toLowerCase()}`)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={`/learn/${topic.id}`}>
                <button className="w-full px-4 py-2 text-sm font-medium text-center bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                  {t('library.readMore')}
                </button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}