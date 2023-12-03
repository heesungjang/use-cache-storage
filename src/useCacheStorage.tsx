import { useState } from 'react';

const UNIQUE_KEY = 'ucs';

interface StoredItem<T> {
  value: T;
  expiration: string;
}

export type DateAddInterval =
  | 'year'
  | 'quarter'
  | 'month'
  | 'week'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second';

export function dateAdd(
  date: Date,
  interval: DateAddInterval,
  units: number
): Date {
  const ret: Date = new Date(date.toString()); // don't change original date
  switch (interval.toLowerCase()) {
    case 'year':
      ret.setFullYear(ret.getFullYear() + units);
      break;
    case 'quarter':
      ret.setMonth(ret.getMonth() + 3 * units);
      break;
    case 'month':
      ret.setMonth(ret.getMonth() + units);
      break;
    case 'week':
      ret.setDate(ret.getDate() + 7 * units);
      break;
    case 'day':
      ret.setDate(ret.getDate() + units);
      break;
    case 'hour':
      ret.setTime(ret.getTime() + units * 3600000);
      break;
    case 'minute':
      ret.setTime(ret.getTime() + units * 60000);
      break;
    case 'second':
      ret.setTime(ret.getTime() + units * 1000);
      break;
    default:
      ret.setTime(ret.getTime() + 5 * 60000);
      break;
  }
  return ret;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createCache(o: any, expire?: Date): string {
  if (expire === undefined) {
    expire = dateAdd(new Date(), 'minute', 5);
  }

  return JSON.stringify({ UNIQUE_KEY, expiration: expire, value: o });
}

export default function useCacheStorage<T>(
  storageType: 'local' | 'session' = 'local'
) {
  const [storage] = useState(() =>
    storageType === 'session' ? sessionStorage : localStorage
  );

  const parseItem = (item: string | null): StoredItem<T> | null => {
    if (item === null) {
      return null;
    }
    try {
      return JSON.parse(item) as StoredItem<T>;
    } catch {
      return null;
    }
  };

  const getValue = (key: string): T | null => {
    const item = storage.getItem(key);
    const parsedItem = parseItem(item);
    if (parsedItem && new Date(parsedItem.expiration) > new Date()) {
      return parsedItem.value;
    }
    return null;
  };

  const setValue = (
    key: string,
    value: T,
    interval: DateAddInterval,
    units: number
  ): void => {
    const expiration = dateAdd(new Date(), interval, units);
    const item: StoredItem<T> = { value, expiration: expiration.toISOString() };
    storage.setItem(key, createCache(item, expiration));
  };

  const removeValue = (key: string): void => {
    storage.removeItem(key);
  };

  const clearExpired = (): void => {
    Object.keys(storage).forEach((key) => {
      /**
         *   const key = this.store.key(i);
      if (key !== null) {
        // test the stored item to see if we stored it
        if (/["|']?pnp["|']? ?: ?1/i.test(<string>this.store.getItem(key))) {
          // get those items as get will delete from cache if they are expired
          await this.get(key);
        }
      }
         */
      const item = storage.getItem(key);
      const parsedItem = parseItem(item);

      if (parsedItem && new Date(parsedItem.expiration) <= new Date()) {
        storage.removeItem(key);
      }
    });
  };

  return { getValue, setValue, removeValue, clearExpired };
}
