import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient } from "@/lib/queryClient";

const languages = {
  en: { name: 'English', flag: '🇺🇸' },
  'es-419': { name: 'Español (Latinoamérica)', flag: '🌎' },
};

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleLanguageChange = async (code: string) => {
    try {
      await i18n.changeLanguage(code);
      localStorage.setItem('i18nextLng', code);
      // Force a re-render of all components by invalidating queries
      await queryClient.invalidateQueries();
      // Force reload translations
      await i18n.reloadResources();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Select Language</span>
          <span className="absolute -bottom-1 -right-1 text-xs">
            {i18n.language === 'es-419' ? '🌎' : '🇺🇸'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([code, { name, flag }]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code)}
            className={i18n.language === code ? "bg-accent" : ""}
          >
            <span className="mr-2">{flag}</span>
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}