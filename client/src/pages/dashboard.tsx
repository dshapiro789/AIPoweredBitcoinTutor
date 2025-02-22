import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Simplified Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-4xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground text-lg">
          Start your Bitcoin learning journey through an interactive chat experience
        </p>

        {/* Chat Entry Point */}
        <div className="mt-12 p-8 rounded-lg border bg-card text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Ready to Learn?</h2>
          <p className="text-muted-foreground mb-6">
            Chat with our AI tutor to learn about any Bitcoin topic - from basics to advanced concepts
          </p>
          <a 
            href="/chat"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Learning
          </a>
        </div>
      </div>
    </div>
  );
}