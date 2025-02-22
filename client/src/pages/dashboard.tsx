import { useQuery } from "@tanstack/react-query";
import { BitcoinTopic } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Loader2, Book, ChevronRight } from "lucide-react";
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
      {/* Header - kept unchanged */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Simplified Topics List */}
      <div className="max-w-2xl mx-auto">
        <div className="divide-y divide-border rounded-lg border bg-card">
          {topics?.map((topic) => (
            <Link key={topic.id} href={`/chat/${topic.id}`}>
              <div className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <Book className="h-5 w-5 text-primary" />
                  <span className="font-medium">{topic.name}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {t(`dashboard.topics.difficulty.${topic.difficulty.toLowerCase()}`)}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}