import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function LearnPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">{t('app.title')}</h1>
        <p className="text-lg text-muted-foreground mb-12">
          {t('app.description')}
        </p>

        <div className="p-8 rounded-lg border bg-card">
          <MessageCircle className="h-12 w-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Start Learning Bitcoin</h2>
          <p className="text-muted-foreground mb-6">
            Chat with our AI tutor to learn about any Bitcoin topic - from basics to advanced concepts
          </p>
          <Link href="/chat">
            <Button size="lg" className="w-full">
              Start Learning
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}