import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCachedAudio, cacheAudio } from "@/lib/audio-cache";

interface VoiceOverPlayerProps {
  text: string;
  className?: string;
}

// Queue to track ongoing requests
const requestQueue = new Map<string, Promise<Blob>>();

export function VoiceOverPlayer({ text, className }: VoiceOverPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playVoiceOver = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      const cacheKey = `${i18n.language}:${text}`;

      // Try to get from cache first
      const cachedAudio = await getCachedAudio(text, i18n.language);
      if (cachedAudio) {
        await playAudioBlob(cachedAudio);
        return;
      }

      // Check if there's already a request in progress for this text/language
      let audioBlob: Blob;
      if (requestQueue.has(cacheKey)) {
        audioBlob = await requestQueue.get(cacheKey)!;
      } else {
        const request = fetchAudio();
        requestQueue.set(cacheKey, request);
        try {
          audioBlob = await request;
          await cacheAudio(text, i18n.language, audioBlob);
        } finally {
          requestQueue.delete(cacheKey);
        }
      }

      await playAudioBlob(audioBlob);
    } catch (error: any) {
      setHasError(true);
      const isRateLimit = error.message?.includes('capacity');
      toast({
        title: t('voiceOver.error'),
        description: isRateLimit ? t('voiceOver.rateLimitError') : t('voiceOver.generationError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAudio = async (): Promise<Blob> => {
    const response = await apiRequest("POST", "/api/voice-over", {
      text,
      language: i18n.language
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate voice-over');
    }

    return response.blob();
  };

  const playAudioBlob = async (blob: Blob) => {
    const url = URL.createObjectURL(blob);

    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      setIsPlaying(false);
      setHasError(true);
      URL.revokeObjectURL(url);
      toast({
        title: t('voiceOver.error'),
        description: t('voiceOver.playbackError'),
        variant: "destructive"
      });
    };

    await audio.play();
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