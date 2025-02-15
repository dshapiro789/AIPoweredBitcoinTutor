import { useQuery } from "@tanstack/react-query";
import type { BitcoinTopic } from "@shared/schema";
import { Bitcoin, Book, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: topics, isLoading, error } = useQuery<BitcoinTopic[]>({
    queryKey: ["/api/bitcoin/topics", i18n.language],
    queryFn: async () => {
      const response = await fetch(`/api/bitcoin/topics?lang=${i18n.language}`);
      if (!response.ok) throw new Error('Failed to fetch topics');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 mb-8">
            <CardContent className="p-6 sm:p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-destructive mb-4">Failed to load topics. Please try again later.</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            <Loader2 className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Bitcoin className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                {t('app.title')}
              </h1>
            </div>

            <p className="text-base sm:text-lg text-muted-foreground">
              {t('app.description')}
            </p>
          </CardContent>
        </Card>

        {/* Learning Path Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-semibold">{t('nav.subjects')}</h2>
          </div>

          <div className="space-y-4">
            {(topics || []).map((topic) => (
              <Card 
                key={topic.id} 
                className="transition-colors hover:bg-muted/50"
                onClick={() => setLocation(`/chat/${topic.id}`)}
                role="button"
                tabIndex={0}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">{topic.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {topic.description}
                      </p>
                      {topic.category && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {topic.category}
                          </span>
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {t(`topics.difficulty.${topic.difficulty.toLowerCase()}`)}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}