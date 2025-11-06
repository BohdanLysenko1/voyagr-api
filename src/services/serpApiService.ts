import axios, { AxiosError } from 'axios';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../config/constants';
import {
  serpCache,
  getOrSet,
  generateRestaurantCacheKey,
  generateAttractionCacheKey,
  generateHotelCacheKey,
  generateFlightCacheKey,
} from '../utils/cache';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * SERP API Place/Location Result
 * Used for restaurants, hotels, attractions
 */
export interface SerpPlaceResult {
  name: string;
  rating?: number;
  reviews?: number;
  priceLevel?: string;
  address?: string;
  category?: string;
  hours?: string;
  imageUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  description?: string;
  phone?: string;
  website?: string;
}

/**
 * SERP API Flight Result
 */
export interface SerpFlightResult {
  id: string;
  airline: string;
  flightNumber?: string;
  departure: {
    time: string;
    airport: string;
    airportCode: string;
  };
  arrival: {
    time: string;
    airport: string;
    airportCode: string;
  };
  duration: string;
  price: number;
  currency: string;
  stops: number;
  layovers?: string[];
  carbonEmissions?: number;
  bookingUrl?: string;
  bookingToken?: string;
}

/**
 * Search options for restaurants
 */
export interface RestaurantSearchOptions {
  cuisine?: string;
  priceLevel?: string;
  limit?: number;
}

/**
 * Search options for attractions
 */
export interface AttractionSearchOptions {
  interests?: string[];
  limit?: number;
}

/**
 * Search options for hotels
 */
export interface HotelSearchOptions {
  budget?: number;
  limit?: number;
  checkIn?: string;
  checkOut?: string;
}

/**
 * Search options for flights
 */
export interface FlightSearchOptions {
  adults?: number;
  children?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  limit?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const SERPAPI_BASE_URL = 'https://serpapi.com/search';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_LIMIT = 10;


// Comprehensive city/region to IATA airport code mapping
const CITY_TO_IATA: Record<string, string> = {
  // North America - Major Cities
  'new york': 'JFK', 'new york city': 'JFK', 'nyc': 'JFK', 'manhattan': 'JFK', 'brooklyn': 'JFK', 'queens': 'JFK', 'bronx': 'JFK',
  'los angeles': 'LAX', 'la': 'LAX', 'hollywood': 'LAX', 'santa monica': 'LAX', 'beverly hills': 'LAX',
  'chicago': 'ORD', 'river forest': 'ORD', 'evanston': 'ORD', 'oak park': 'ORD', 'naperville': 'ORD',
  'san francisco': 'SFO', 'sf': 'SFO', 'oakland': 'OAK', 'san jose': 'SJC',
  'miami': 'MIA', 'miami beach': 'MIA', 'fort lauderdale': 'FLL',
  'boston': 'BOS', 'cambridge': 'BOS', 'somerville': 'BOS',
  'seattle': 'SEA', 'bellevue': 'SEA', 'tacoma': 'SEA',
  'washington': 'DCA', 'dc': 'DCA', 'washington dc': 'DCA', 'arlington': 'DCA',
  'atlanta': 'ATL', 'dallas': 'DFW', 'houston': 'IAH', 'phoenix': 'PHX',
  'philadelphia': 'PHL', 'las vegas': 'LAS', 'orlando': 'MCO', 'denver': 'DEN',
  'portland': 'PDX', 'austin': 'AUS', 'nashville': 'BNA', 'new orleans': 'MSY',

  // Canada
  'toronto': 'YYZ', 'mississauga': 'YYZ', 'scarborough': 'YYZ',
  'vancouver': 'YVR', 'burnaby': 'YVR', 'richmond': 'YVR',
  'montreal': 'YUL', 'calgary': 'YYC', 'ottawa': 'YOW', 'edmonton': 'YEG',

  // Mexico & Central America
  'mexico city': 'MEX', 'cancun': 'CUN', 'guadalajara': 'GDL', 'monterrey': 'MTY',

  // Europe - UK & Ireland
  'london': 'LHR', 'westminster': 'LHR', 'city of london': 'LHR', 'heathrow': 'LHR',
  'manchester': 'MAN', 'edinburgh': 'EDI', 'glasgow': 'GLA', 'dublin': 'DUB',

  // Europe - France
  'paris': 'CDG', 'marseille': 'MRS', 'lyon': 'LYS', 'nice': 'NCE', 'toulouse': 'TLS',

  // Europe - Germany
  'berlin': 'BER', 'munich': 'MUC', 'frankfurt': 'FRA', 'hamburg': 'HAM', 'cologne': 'CGN', 'dusseldorf': 'DUS',

  // Europe - Spain
  'madrid': 'MAD', 'barcelona': 'BCN', 'seville': 'SVQ', 'valencia': 'VLC', 'malaga': 'AGP',

  // Europe - Italy
  'rome': 'FCO', 'milan': 'MXP', 'venice': 'VCE', 'florence': 'FLR', 'naples': 'NAP', 'bologna': 'BLQ',

  // Europe - Other
  'amsterdam': 'AMS', 'rotterdam': 'RTM', 'brussels': 'BRU', 'zurich': 'ZRH', 'geneva': 'GVA',
  'vienna': 'VIE', 'copenhagen': 'CPH', 'stockholm': 'ARN', 'oslo': 'OSL', 'helsinki': 'HEL',
  'athens': 'ATH', 'lisbon': 'LIS', 'porto': 'OPO', 'prague': 'PRG', 'budapest': 'BUD',
  'warsaw': 'WAW', 'krakow': 'KRK', 'istanbul': 'IST',

  // Asia - Japan
  'tokyo': 'NRT', 'osaka': 'KIX', 'kyoto': 'KIX', 'nagoya': 'NGO', 'fukuoka': 'FUK', 'sapporo': 'CTS', 'hiroshima': 'HIJ',

  // Asia - China
  'beijing': 'PEK', 'shanghai': 'PVG', 'guangzhou': 'CAN', 'shenzhen': 'SZX', 'chengdu': 'CTU', 'hong kong': 'HKG',

  // Asia - Southeast Asia
  'singapore': 'SIN', 'bangkok': 'BKK', 'kuala lumpur': 'KUL', 'manila': 'MNL', 'jakarta': 'CGK',
  'ho chi minh': 'SGN', 'saigon': 'SGN', 'hanoi': 'HAN',
  'phuket': 'HKT', 'bali': 'DPS', 'denpasar': 'DPS',
  // Thailand cities
  'chiang mai': 'CNX', 'krabi': 'KBV', 'pattaya': 'UTP', 'koh samui': 'USM', 'hat yai': 'HDY',

  // Asia - South Asia
  'delhi': 'DEL', 'new delhi': 'DEL', 'mumbai': 'BOM', 'bombay': 'BOM', 'bangalore': 'BLR', 'chennai': 'MAA',
  'hyderabad': 'HYD', 'kolkata': 'CCU', 'calcutta': 'CCU',

  // Asia - Middle East
  'dubai': 'DXB', 'abu dhabi': 'AUH', 'doha': 'DOH', 'riyadh': 'RUH', 'jeddah': 'JED',
  'tel aviv': 'TLV', 'jerusalem': 'TLV', 'amman': 'AMM', 'beirut': 'BEY',

  // Asia - Other
  'seoul': 'ICN', 'taipei': 'TPE', 'kaohsiung': 'KHH',

  // Oceania
  'sydney': 'SYD', 'melbourne': 'MEL', 'brisbane': 'BNE', 'perth': 'PER', 'adelaide': 'ADL',
  'auckland': 'AKL', 'wellington': 'WLG', 'christchurch': 'CHC',

  // South America
  'sao paulo': 'GRU', 'rio de janeiro': 'GIG', 'rio': 'GIG', 'brasilia': 'BSB',
  'buenos aires': 'EZE', 'santiago': 'SCL', 'lima': 'LIM', 'bogota': 'BOG',
  'medellin': 'MDE', 'cartagena': 'CTG', 'quito': 'UIO', 'guayaquil': 'GYE',

  // Africa
  'johannesburg': 'JNB', 'cape town': 'CPT', 'durban': 'DUR', 'cairo': 'CAI',
  'nairobi': 'NBO', 'lagos': 'LOS', 'accra': 'ACC', 'casablanca': 'CMN', 'marrakech': 'RAK',

  // Common IATA codes (pass through)
  'jfk': 'JFK', 'lax': 'LAX', 'ord': 'ORD', 'lhr': 'LHR', 'cdg': 'CDG', 'nrt': 'NRT',
  'hnd': 'HND', 'dxb': 'DXB', 'sin': 'SIN', 'icn': 'ICN', 'hkg': 'HKG',
};

/**
 * Get Wikidata Freebase ID (kgmid) for a city/location
 * Returns format: /m/xxxxx which Google Flights accepts
 */
const getWikidataFreebaseId = async (cityName: string): Promise<string | null> => {
  try {
    console.log(`🔍 Searching Wikidata for: ${cityName}`);

    // Search Wikidata for the city
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(cityName)}&language=en&format=json&limit=1`;

    const searchResponse = await axios.get(searchUrl, { timeout: 5000 });
    const results = searchResponse.data.search;

    if (!results || results.length === 0) {
      console.log(`⚠️ No Wikidata results for: ${cityName}`);
      return null;
    }

    const entityId = results[0].id; // e.g., Q1861 for Bangkok
    console.log(`📍 Found Wikidata entity: ${entityId} (${results[0].label})`);

    // Get the Freebase ID from the entity
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims&format=json`;
    const entityResponse = await axios.get(entityUrl, { timeout: 5000 });

    const claims = entityResponse.data.entities[entityId]?.claims;
    const freebaseProperty = claims?.P646; // P646 is the Freebase ID property

    if (freebaseProperty && freebaseProperty.length > 0) {
      const freebaseId = freebaseProperty[0].mainsnak.datavalue.value;
      console.log(`✅ Found Freebase ID: ${freebaseId}`);
      return freebaseId; // Returns format like "/m/0dl60"
    }

    console.log(`⚠️ No Freebase ID found for entity: ${entityId}`);
    return null;
  } catch (error: any) {
    console.error(`❌ Error fetching Wikidata ID for ${cityName}:`, error?.message || error);
    return null;
  }
};

/**
 * Normalize city/airport name to IATA code, Freebase ID, or city name
 */
const normalizeToIATACode = async (location: string): Promise<string> => {
  if (!location) return '';

  const normalized = location.toLowerCase().trim();

  // Check if it's already a 3-letter IATA code
  if (/^[A-Z]{3}$/i.test(location.trim())) {
    return location.trim().toUpperCase();
  }

  // Check if it's already a Freebase ID
  if (location.trim().startsWith('/m/')) {
    return location.trim();
  }

  // Look up in our mapping
  const iataCode = CITY_TO_IATA[normalized];
  if (iataCode) {
    console.log(`✅ Mapped ${location} → ${iataCode} (from cache)`);
    return iataCode;
  }

  // Try partial matches for compound names
  for (const [city, code] of Object.entries(CITY_TO_IATA)) {
    if (normalized.includes(city) || city.includes(normalized)) {
      console.log(`✅ Mapped ${location} → ${code} (partial match: ${city})`);
      return code;
    }
  }

  // Try to get Freebase ID from Wikidata
  const freebaseId = await getWikidataFreebaseId(location);
  if (freebaseId) {
    return freebaseId;
  }

  // Final fallback: return the city name and let SERP API try to handle it
  console.warn(`⚠️ No IATA code or Freebase ID found for: "${location}". Trying city name as-is.`);
  return location.trim();
};


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if SERP API is configured
 */
export const isSerpApiConfigured = (): boolean => {
  return !!SERPAPI_KEY && SERPAPI_KEY.length > 0;
};

/**
 * Handle SERP API errors with detailed logging
 */
const handleSerpApiError = (error: any, context: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`SERP API Error [${context}]:`, {
        status: axiosError.response.status,
        data: axiosError.response.data,
      });

      throw new AppError(
        `SERP API returned error: ${axiosError.response.status}`,
        HTTP_STATUS.BAD_GATEWAY
      );
    } else if (axiosError.request) {
      // The request was made but no response was received
      console.error(`SERP API No Response [${context}]:`, axiosError.message);
      throw new AppError(
        'SERP API did not respond',
        HTTP_STATUS.GATEWAY_TIMEOUT
      );
    }
  }

  // Generic error
  console.error(`SERP API Unknown Error [${context}]:`, error);
  throw new AppError(
    `Failed to ${context}`,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
};

/**
 * Make a request to SERP API with error handling
 */
const makeSerpApiRequest = async (params: Record<string, any>): Promise<any> => {
  if (!isSerpApiConfigured()) {
    throw new AppError(
      'SERP API is not configured. Please set SERPAPI_API_KEY environment variable.',
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  try {
    const response = await axios.get(SERPAPI_BASE_URL, {
      params: {
        ...params,
        api_key: SERPAPI_KEY,
      },
      timeout: DEFAULT_TIMEOUT,
    });

    return response.data;
  } catch (error) {
    throw error; // Will be handled by specific search functions
  }
};

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Search for restaurants in a destination
 * @param destination - City or location name
 * @param options - Search options (cuisine, price level, limit)
 * @returns Array of restaurant results
 */
export const searchRestaurants = async (
  destination: string,
  options: RestaurantSearchOptions = {}
): Promise<SerpPlaceResult[]> => {
  if (!destination || destination.trim().length === 0) {
    throw new AppError('Destination is required', HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const { cuisine, priceLevel, limit = DEFAULT_LIMIT } = options;

    // Generate cache key
    const cacheKey = generateRestaurantCacheKey(destination, options);

    // Try to get from cache or fetch
    return await getOrSet(serpCache, cacheKey, async () => {
      // Build search query
      let query = `restaurants in ${destination.trim()}`;
      if (cuisine) {
        query += ` ${cuisine.trim()}`;
      }
      if (priceLevel) {
        query += ` ${priceLevel}`;
      }

      console.log(`🔍 SERP API: Searching restaurants - "${query}"`);

      const data = await makeSerpApiRequest({
        engine: 'google_maps',
        q: query,
        type: 'search',
      });

      // Parse and transform results
      const results: SerpPlaceResult[] = (data.local_results || [])
        .slice(0, limit)
        .map((place: any) => ({
          name: place.title || 'Unknown Restaurant',
          rating: place.rating || undefined,
          reviews: place.reviews || undefined,
          priceLevel: place.price || undefined,
          address: place.address || undefined,
          category: place.type || 'restaurant',
          hours: place.hours || undefined,
          imageUrl: place.thumbnail || undefined,
          coordinates: place.gps_coordinates
            ? {
                lat: place.gps_coordinates.latitude,
                lng: place.gps_coordinates.longitude,
              }
            : undefined,
          description: place.description || undefined,
          phone: place.phone || undefined,
          website: place.website || undefined,
        }));

      console.log(`✅ SERP API: Found ${results.length} restaurants`);
      return results;
    });
  } catch (error) {
    return handleSerpApiError(error, 'search restaurants');
  }
};

/**
 * Search for attractions and things to do in a destination
 * @param destination - City or location name
 * @param options - Search options (interests, limit)
 * @returns Array of attraction results
 */
export const searchAttractions = async (
  destination: string,
  options: AttractionSearchOptions = {}
): Promise<SerpPlaceResult[]> => {
  if (!destination || destination.trim().length === 0) {
    throw new AppError('Destination is required', HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const { interests = [], limit = DEFAULT_LIMIT } = options;

    // Generate cache key
    const cacheKey = generateAttractionCacheKey(destination, options);

    // Try to get from cache or fetch
    return await getOrSet(serpCache, cacheKey, async () => {
      // Build search query with interests
      let query = `things to do in ${destination.trim()}`;
      if (interests.length > 0) {
        query += ` ${interests.join(' ')}`;
      }

      console.log(`🔍 SERP API: Searching attractions - "${query}"`);

      const data = await makeSerpApiRequest({
        engine: 'google_maps',
        q: query,
        type: 'search',
      });

      // Parse and transform results
      const results: SerpPlaceResult[] = (data.local_results || [])
        .slice(0, limit)
        .map((place: any) => ({
          name: place.title || 'Unknown Attraction',
          rating: place.rating || undefined,
          reviews: place.reviews || undefined,
          priceLevel: place.price || undefined,
          address: place.address || undefined,
          category: place.type || 'attraction',
          hours: place.hours || undefined,
          imageUrl: place.thumbnail || undefined,
          coordinates: place.gps_coordinates
            ? {
                lat: place.gps_coordinates.latitude,
                lng: place.gps_coordinates.longitude,
              }
            : undefined,
          description: place.description || undefined,
          phone: place.phone || undefined,
          website: place.website || undefined,
        }));

      console.log(`✅ SERP API: Found ${results.length} attractions`);
      return results;
    });
  } catch (error) {
    return handleSerpApiError(error, 'search attractions');
  }
};

/**
 * Search for hotels in a destination
 * @param destination - City or location name
 * @param options - Search options (budget, dates, limit)
 * @returns Array of hotel results
 */
export const searchHotels = async (
  destination: string,
  options: HotelSearchOptions = {}
): Promise<SerpPlaceResult[]> => {
  if (!destination || destination.trim().length === 0) {
    throw new AppError('Destination is required', HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const { limit = DEFAULT_LIMIT, checkIn, checkOut } = options;

    // Generate cache key
    const cacheKey = generateHotelCacheKey(destination, options);

    // Try to get from cache or fetch
    return await getOrSet(serpCache, cacheKey, async () => {
      console.log(`🔍 SERP API: Searching hotels in "${destination}"`);

      const params: Record<string, any> = {
        engine: 'google_hotels',
        q: destination.trim(),
        currency: 'USD',
      };

      if (checkIn) {
        params.check_in_date = checkIn;
      }
      if (checkOut) {
        params.check_out_date = checkOut;
      }

      const data = await makeSerpApiRequest(params);

      // Parse and transform results
      const results: SerpPlaceResult[] = (data.properties || [])
        .slice(0, limit)
        .map((hotel: any) => ({
          name: hotel.name || 'Unknown Hotel',
          rating: hotel.overall_rating || undefined,
          reviews: hotel.reviews || undefined,
          priceLevel: hotel.rate_per_night?.lowest
            ? `$${hotel.rate_per_night.lowest}`
            : undefined,
          address: hotel.link || undefined,
          category: 'hotel',
          imageUrl: hotel.images?.[0]?.thumbnail || undefined,
          description: hotel.description || undefined,
          website: hotel.link || undefined,
        }));

      console.log(`✅ SERP API: Found ${results.length} hotels`);
      return results;
    });
  } catch (error) {
    return handleSerpApiError(error, 'search hotels');
  }
};

/**
 * Search for flights between two destinations
 * @param origin - Origin city or airport code
 * @param destination - Destination city or airport code
 * @param departureDate - Departure date (YYYY-MM-DD)
 * @param returnDate - Optional return date (YYYY-MM-DD)
 * @param options - Search options (passengers, cabin class, limit)
 * @returns Array of flight results
 */
export const searchFlights = async (
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  options: FlightSearchOptions = {}
): Promise<SerpFlightResult[]> => {
  if (!origin || origin.trim().length === 0) {
    throw new AppError('Origin is required', HTTP_STATUS.BAD_REQUEST);
  }
  if (!destination || destination.trim().length === 0) {
    throw new AppError('Destination is required', HTTP_STATUS.BAD_REQUEST);
  }
  if (!departureDate || departureDate.trim().length === 0) {
    throw new AppError('Departure date is required', HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const { adults = 1, children = 0, cabinClass = 'economy', limit = DEFAULT_LIMIT } = options;

    // Generate cache key
    const cacheKey = generateFlightCacheKey(
      origin,
      destination,
      departureDate,
      returnDate,
      options
    );

    // Try to get from cache or fetch
    // Note: Flights have shorter cache time (5 minutes) as prices change frequently
    return await getOrSet(serpCache, cacheKey, async () => {
      // Normalize origin and destination to IATA codes or Freebase IDs
      const originCode = await normalizeToIATACode(origin);
      const destinationCode = await normalizeToIATACode(destination);

      console.log(`🔍 SERP API: Searching flights ${origin} (${originCode}) → ${destination} (${destinationCode}) on ${departureDate}`);

      const params: Record<string, any> = {
        engine: 'google_flights',
        departure_id: originCode,
        arrival_id: destinationCode,
        outbound_date: departureDate,
        currency: 'USD',
        adults,
        children,
        travel_class: cabinClass === 'economy' ? 1 : cabinClass === 'premium_economy' ? 2 : cabinClass === 'business' ? 3 : 4,
      };

      if (returnDate) {
        params.return_date = returnDate;
        params.type = 1; // Round trip
      } else {
        params.type = 2; // One way
      }

      const data = await makeSerpApiRequest(params);

      // Parse and transform results
      const bestFlights = data.best_flights || [];
      const otherFlights = data.other_flights || [];
      const allFlights = [...bestFlights, ...otherFlights];

      // Log the first flight for debugging to see all available data
      if (allFlights.length > 0 && process.env.NODE_ENV === 'development') {
        console.log('📋 Sample flight object:', JSON.stringify(allFlights[0], null, 2).substring(0, 2000));
      }

      const results: SerpFlightResult[] = allFlights
        .slice(0, limit)
        .map((flight: any, index: number) => {
          const firstLeg = flight.flights?.[0] || {};
          const lastLeg = flight.flights?.[flight.flights?.length - 1] || {};

          // Build Google Flights URL with booking token if available
          // This shows the specific flight on Google Flights where users can see all booking options
          let bookingUrl: string;

          if (flight.booking_token) {
            // Use booking token to link directly to this flight on Google Flights
            bookingUrl = `https://www.google.com/travel/flights?hl=en&gl=us&curr=USD&tfs=${encodeURIComponent(flight.booking_token)}`;
          } else if (data.search_metadata?.google_flights_url) {
            // Fallback to general search results
            bookingUrl = data.search_metadata.google_flights_url;
          } else {
            // Final fallback - construct search URL
            const depCode = firstLeg.departure_airport?.id || originCode;
            const arrCode = lastLeg.arrival_airport?.id || destinationCode;
            bookingUrl = `https://www.google.com/travel/flights/search?q=flights+from+${depCode}+to+${arrCode}+on+${departureDate}`;
          }

          return {
            id: `flight_${index}_${Date.now()}`,
            airline: firstLeg.airline || 'Unknown Airline',
            flightNumber: firstLeg.flight_number || undefined,
            departure: {
              time: firstLeg.departure_airport?.time || '',
              airport: firstLeg.departure_airport?.name || origin,
              airportCode: firstLeg.departure_airport?.id || origin,
            },
            arrival: {
              time: lastLeg.arrival_airport?.time || '',
              airport: lastLeg.arrival_airport?.name || destination,
              airportCode: lastLeg.arrival_airport?.id || destination,
            },
            duration: formatDuration(flight.total_duration || 0),
            price: flight.price || 0,
            currency: 'USD',
            stops: (flight.flights?.length || 1) - 1,
            layovers: flight.layovers?.map((l: any) => l.name) || undefined,
            carbonEmissions: flight.carbon_emissions?.this_flight || undefined,
            bookingUrl,
            bookingToken: flight.booking_token || undefined,
          };
        });

      console.log(`✅ SERP API: Found ${results.length} flights`);
      return results;
    }, 300); // 5 minutes cache for flights (prices change frequently)
  } catch (error) {
    return handleSerpApiError(error, 'search flights');
  }
};

/**
 * Get booking options for a specific flight using booking_token
 * @param bookingToken - Token from flight search results
 * @returns Array of booking options with provider links
 */
export const getFlightBookingOptions = async (
  bookingToken: string
): Promise<any[]> => {
  if (!bookingToken || bookingToken.trim().length === 0) {
    throw new AppError('Booking token is required', HTTP_STATUS.BAD_REQUEST);
  }

  try {
    console.log(`🔍 SERP API: Fetching booking options for token: ${bookingToken.substring(0, 50)}...`);

    const params: Record<string, any> = {
      engine: 'google_flights',
      booking_token: bookingToken,
    };

    const data = await makeSerpApiRequest(params);

    // Extract booking options from response
    const bookingOptions = data.booking_options || [];

    console.log(`✅ SERP API: Found ${bookingOptions.length} booking options`);

    // Transform booking options to include direct URLs
    const transformedOptions = bookingOptions.map((option: any) => ({
      provider: option.book_with || 'Unknown Provider',
      price: option.price || 0,
      // Google's redirect URL that forwards to the actual booking page
      bookingUrl: option.booking_request?.url || '',
      // Additional metadata
      agency: option.agency || undefined,
      agencyLink: option.agency_link || undefined,
    }));

    return transformedOptions;
  } catch (error) {
    return handleSerpApiError(error, 'get booking options');
  }
};

/**
 * Format duration in minutes to human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "2h 30m")
 */
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  searchRestaurants,
  searchAttractions,
  searchHotels,
  searchFlights,
  getFlightBookingOptions,
  isSerpApiConfigured,
};
