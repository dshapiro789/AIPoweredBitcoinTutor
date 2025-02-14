import { openDB } from 'idb';

const CACHE_NAME = 'voice-over-cache';
const CACHE_VERSION = 1;

interface CacheEntry {
  audio: Blob;
  language: string;
  timestamp: number;
}

async function getDb() {
  return openDB(CACHE_NAME, CACHE_VERSION, {
    upgrade(db) {
      db.createObjectStore('audio');
    },
  });
}

export async function getCachedAudio(text: string, language: string): Promise<Blob | null> {
  const db = await getDb();
  const entry: CacheEntry | undefined = await db.get('audio', `${language}:${text}`);
  
  if (!entry) return null;
  
  // Cache for 24 hours
  if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
    await db.delete('audio', `${language}:${text}`);
    return null;
  }
  
  return entry.audio;
}

export async function cacheAudio(text: string, language: string, audio: Blob): Promise<void> {
  const db = await getDb();
  const entry: CacheEntry = {
    audio,
    language,
    timestamp: Date.now(),
  };
  await db.put('audio', entry, `${language}:${text}`);
}
