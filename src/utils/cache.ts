import NodeCache from 'node-cache';

/**
 * Cache utility for storing API responses
 * Helps reduce API calls and improve response times
 */

// ============================================================================
// CACHE INSTANCES
// ============================================================================

/**
 * SERP API Cache Configuration
 * - stdTTL: 900 seconds (15 minutes) - reasonable time for travel data
 * - checkperiod: 120 seconds - check for expired keys every 2 minutes
 * - useClones: false - better performance, data is immutable
 */
export const serpCache = new NodeCache({
  stdTTL: 900, // 15 minutes
  checkperiod: 120, // 2 minutes
  useClones: false,
  deleteOnExpire: true,
});

/**
 * General API Cache Configuration
 * - stdTTL: 300 seconds (5 minutes) - for general API responses
 */
export const apiCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // 1 minute
  useClones: false,
  deleteOnExpire: true,
});

// ============================================================================
// CACHE KEY GENERATORS
// ============================================================================

/**
 * Generate a cache key for restaurant searches
 */
export const generateRestaurantCacheKey = (
  destination: string,
  options?: { cuisine?: string; priceLevel?: string; limit?: number }
): string => {
  const parts = ['restaurants', destination.toLowerCase()];

  if (options?.cuisine) {
    parts.push(options.cuisine.toLowerCase());
  }
  if (options?.priceLevel) {
    parts.push(options.priceLevel);
  }
  if (options?.limit) {
    parts.push(`limit:${options.limit}`);
  }

  return parts.join(':');
};

/**
 * Generate a cache key for attraction searches
 */
export const generateAttractionCacheKey = (
  destination: string,
  options?: { interests?: string[]; limit?: number }
): string => {
  const parts = ['attractions', destination.toLowerCase()];

  if (options?.interests && options.interests.length > 0) {
    parts.push(options.interests.sort().join('-').toLowerCase());
  }
  if (options?.limit) {
    parts.push(`limit:${options.limit}`);
  }

  return parts.join(':');
};

/**
 * Generate a cache key for hotel searches
 */
export const generateHotelCacheKey = (
  destination: string,
  options?: { checkIn?: string; checkOut?: string; budget?: number; limit?: number }
): string => {
  const parts = ['hotels', destination.toLowerCase()];

  if (options?.checkIn) {
    parts.push(`checkin:${options.checkIn}`);
  }
  if (options?.checkOut) {
    parts.push(`checkout:${options.checkOut}`);
  }
  if (options?.budget) {
    parts.push(`budget:${options.budget}`);
  }
  if (options?.limit) {
    parts.push(`limit:${options.limit}`);
  }

  return parts.join(':');
};

/**
 * Generate a cache key for flight searches
 */
export const generateFlightCacheKey = (
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  options?: { adults?: number; children?: number; cabinClass?: string; limit?: number }
): string => {
  const parts = [
    'flights',
    origin.toLowerCase(),
    destination.toLowerCase(),
    departureDate,
  ];

  if (returnDate) {
    parts.push(returnDate);
  }
  if (options?.adults) {
    parts.push(`adults:${options.adults}`);
  }
  if (options?.children) {
    parts.push(`children:${options.children}`);
  }
  if (options?.cabinClass) {
    parts.push(options.cabinClass.toLowerCase());
  }
  if (options?.limit) {
    parts.push(`limit:${options.limit}`);
  }

  return parts.join(':');
};

// ============================================================================
// CACHE HELPER FUNCTIONS
// ============================================================================

/**
 * Get data from cache or execute function and cache result
 * @param cache - NodeCache instance
 * @param key - Cache key
 * @param fetchFn - Function to execute if cache miss
 * @param ttl - Optional TTL override
 * @returns Cached or fetched data
 */
export async function getOrSet<T>(
  cache: NodeCache,
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    console.log(`✅ Cache HIT: ${key}`);
    return cached;
  }

  console.log(`❌ Cache MISS: ${key}`);

  // Cache miss - fetch data
  const data = await fetchFn();

  // Store in cache
  if (ttl) {
    cache.set(key, data, ttl);
  } else {
    cache.set(key, data);
  }

  return data;
}

/**
 * Clear all SERP API cache
 */
export const clearSerpCache = (): void => {
  const keys = serpCache.keys();
  serpCache.del(keys);
  console.log(`🗑️  Cleared ${keys.length} SERP cache entries`);
};

/**
 * Clear specific cache entries by pattern
 */
export const clearCacheByPattern = (
  cache: NodeCache,
  pattern: string
): number => {
  const keys = cache.keys();
  const matchingKeys = keys.filter((key) => key.includes(pattern));
  const deletedCount = cache.del(matchingKeys);
  console.log(
    `🗑️  Cleared ${deletedCount} cache entries matching pattern: ${pattern}`
  );
  return deletedCount;
};

/**
 * Get cache statistics
 */
export const getCacheStats = (cache: NodeCache) => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize,
  };
};

/**
 * Log cache statistics
 */
export const logCacheStats = (): void => {
  console.log('📊 Cache Statistics:');
  console.log('  SERP Cache:', getCacheStats(serpCache));
  console.log('  API Cache:', getCacheStats(apiCache));
};

// ============================================================================
// CACHE EVENT HANDLERS
// ============================================================================

// Log when cache entries expire
serpCache.on('expired', (key, value) => {
  console.log(`⏰ SERP cache entry expired: ${key}`);
});

// Log cache errors
serpCache.on('error', (error) => {
  console.error('❌ SERP cache error:', error);
});

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  serpCache,
  apiCache,
  generateRestaurantCacheKey,
  generateAttractionCacheKey,
  generateHotelCacheKey,
  generateFlightCacheKey,
  getOrSet,
  clearSerpCache,
  clearCacheByPattern,
  getCacheStats,
  logCacheStats,
};
