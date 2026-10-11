import { useEffect, useState } from 'react';
import { fetchDownloads } from '../../lib/downloads';

/** Download count of one font: the build-time value first, the live one once it arrives. */
export function useDownloads(slug: string, initial: number): number {
  const [n, setN] = useState(initial);
  useEffect(() => {
    let alive = true;
    fetchDownloads().then((all) => alive && typeof all[slug] === 'number' && setN(all[slug]));
    return () => {
      alive = false;
    };
  }, [slug, initial]);
  return n;
}
