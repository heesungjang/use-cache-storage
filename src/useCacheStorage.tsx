import { useState } from 'react';
import CacheStore from './cacheStorage';

export default function useCacheStorage(
  storageType: 'local' | 'session' = 'local'
) {
  const [storage] = useState(() => new CacheStore(storageType));

  return storage;
}
