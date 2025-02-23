import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function Nav() {
  const { t } = useTranslation();

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2 text-xl font-bold group">
              <img 
                src="/btcl.png"
                alt="Bitcoin Logo"
                className="w-6 h-6 transition-transform duration-200 group-hover:scale-110"
                loading="lazy"
              />
              {t('app.shortTitle')}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}