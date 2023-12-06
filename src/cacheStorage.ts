type StoreType = 'session' | 'local';

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

const UNIQUE_KEY = 'ucs';
class CacheStore {
  private storage: Storage;
  constructor(store: StoreType) {
    this.storage = store === 'local' ? localStorage : sessionStorage;
  }

  private parseItem<T>(item: string | null): StoredItem<T> | null {
    if (item === null) return null;

    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  }

  public get<T>(key: string): T | null {
    const item = this.storage.getItem(key);
    const parsedItem = this.parseItem<T>(item);

    if (!(typeof parsedItem !== 'undefined' && parsedItem !== null)) {
      return null;
    }

    if (new Date(parsedItem.expiration) > new Date()) {
      return parsedItem.value as T;
    } else {
      this.delete(key);
      return null;
    }
  }

  public delete(key: string): void {
    this.storage.removeItem(key);
  }

  public set<T>(
    key: string,
    value: T,
    interval?: DateAddInterval,
    units?: number
  ): void {
    const expiration = this.dateAdd(new Date(), interval, units);
    const item: StoredItem<T> = { value, expiration: expiration.toISOString() };
    this.storage.setItem(key, this.createCache(item, expiration));
  }

  private createCache(o: any, expire?: Date): string {
    if (expire === undefined) {
      expire = this.dateAdd(new Date(), 'minute', 5);
    }

    return JSON.stringify({ UNIQUE_KEY, expiration: expire, value: o });
  }

  private dateAdd(
    date: Date,
    interval: DateAddInterval = 'minute',
    units: number = 5
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
}

export default CacheStore;
