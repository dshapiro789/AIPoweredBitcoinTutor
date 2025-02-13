import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./language-selector";

export default function Nav() {
  const { t } = useTranslation();

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-xl font-bold">
              {t('app.shortTitle')}
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">{t('nav.subjects')}</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">{t('nav.dashboard')}</Button>
            </Link>
            <LanguageSelector />
          </div>
        </div>
      </div>
    </nav>
  );
}