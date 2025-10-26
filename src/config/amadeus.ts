import Amadeus from 'amadeus';

/**
 * Checks if Amadeus API credentials are properly configured
 * @returns {boolean} True if both client ID and secret are set
 */
export function isAmadeusConfigured(): boolean {
  return !!(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
}

/**
 * Validates that required Amadeus environment variables are set
 * @throws {Error} If credentials are missing
 */
function validateAmadeusConfig(): void {
  if (!isAmadeusConfigured()) {
    throw new Error(
      'Amadeus API credentials are not configured. ' +
      'Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables.'
    );
  }
}

/**
 * Creates and returns an Amadeus client instance
 * @throws {Error} If credentials are missing
 * @returns {Amadeus} Configured Amadeus client
 */
function createAmadeusClient(): Amadeus {
  validateAmadeusConfig();

  return new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID!,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
    hostname: process.env.NODE_ENV === 'production' ? 'production' : 'test',
  });
}

// Lazy-initialized Amadeus client instance
let amadeusClient: Amadeus | null = null;

/**
 * Gets the Amadeus client instance (singleton pattern with lazy initialization)
 * The client is created on first access and reused for subsequent calls
 * @throws {Error} If credentials are not configured
 * @returns {Amadeus} The Amadeus client instance
 */
export function getAmadeusClient(): Amadeus {
  if (!amadeusClient) {
    amadeusClient = createAmadeusClient();
  }
  return amadeusClient;
}

/**
 * Resets the Amadeus client instance (useful for testing)
 */
export function resetAmadeusClient(): void {
  amadeusClient = null;
}

// Export a default client getter for convenience
export const amadeus = getAmadeusClient;
