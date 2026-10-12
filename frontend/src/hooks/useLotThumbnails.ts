import { useEffect, useState } from 'react';
import { api } from '../services/api';

/** Fetch only visible cards' photos; statistics never wait for image payloads. */
export function useLotThumbnails(ids: string[]) {
  const key = JSON.stringify([...new Set(ids)]);
  const [images, setImages] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    setImages({});
    const queue: string[] = JSON.parse(key);
    const worker = async () => {
      while (active && queue.length) {
        const id = queue.shift()!;
        try {
          const image = await api.getLotThumbnail(id);
          if (active) setImages(previous => ({ ...previous, [id]: image }));
        } catch { /* Existing card fallback remains available; next mount retries. */ }
      }
    };
    void Promise.all([worker(), worker(), worker()]);
    return () => { active = false; };
  }, [key]);
  return images;
}
