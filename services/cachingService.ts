
const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  timestamp: number;
  data: T;
}

export const getCache = <T>(key: string): T | null => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) {
    return null;
  }
  
  try {
    const item: CacheItem<T> = JSON.parse(itemStr);
    const now = new Date().getTime();
    
    // Check for expiration
    if (now - item.timestamp > CACHE_EXPIRATION_MS) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data;
  } catch (error) {
    console.error(`Failed to parse cache item for key "${key}":`, error);
    localStorage.removeItem(key); // Clear corrupted cache
    return null;
  }
};

export const setCache = <T>(key: string, data: T): void => {
  const item: CacheItem<T> = {
    timestamp: new Date().getTime(),
    data: data,
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Failed to set cache item for key "${key}":`, error);
  }
};
