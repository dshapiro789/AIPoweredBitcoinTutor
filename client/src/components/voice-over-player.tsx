import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceOverPlayerProps {
  text: string;
  className?: string;
}

export function VoiceOverPlayer({ text, className }: VoiceOverPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const audioRef = useState<HTMLAudioElement | null>(null);

  const playVoiceOver = async () => {
    try {
      setIsLoading(true);

      const response = await apiRequest("POST", "/api/voice-over", {
        text,
        language: i18n.language
      });

      if (!response.ok) throw new Error('Failed to generate voice-over');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef[0]) {
        audioRef[0].pause();
        URL.revokeObjectURL(audioRef[0].src);
      }

      const audio = new Audio(url);
      audioRef[0] = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        toast({
          title: t('voiceOver.error'),
          description: t('voiceOver.playbackError'),
          variant: "destructive"
        });
      };

      await audio.play();
    } catch (error) {
      toast({
        title: t('voiceOver.error'),
        description: t('voiceOver.generationError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={playVoiceOver}
      disabled={isLoading || isPlaying}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      <span className="ml-2">
        {isPlaying ? t('voiceOver.playing') : t('voiceOver.listen')}
      </span>
    </Button>
  );
}
