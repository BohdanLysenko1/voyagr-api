declare module 'amadeus' {
  export interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
    hostname?: 'test' | 'production';
  }

  export interface FlightSearchParams {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    adults: number;
    returnDate?: string;
    children?: number;
    infants?: number;
    travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    max?: number;
  }

  export interface TravelerInfo {
    id: string;
    dateOfBirth: string;
    name: {
      firstName: string;
      lastName: string;
    };
    gender: 'MALE' | 'FEMALE';
    contact: {
      emailAddress: string;
      phones: Array<{
        deviceType: 'MOBILE' | 'LANDLINE';
        countryCallingCode: string;
        number: string;
      }>;
    };
    documents?: Array<{
      documentType: 'PASSPORT' | 'IDENTITY_CARD';
      birthPlace?: string;
      issuanceLocation?: string;
      issuanceDate?: string;
      number?: string;
      expiryDate?: string;
      issuanceCountry?: string;
      validityCountry?: string;
      nationality?: string;
      holder?: boolean;
    }>;
  }

  export interface FlightOrderRequest {
    data: {
      type: 'flight-order';
      flightOffers: any[];
      travelers: TravelerInfo[];
    };
  }

  export interface AmadeusResponse<T = any> {
    data: T;
    meta?: {
      count: number;
      links?: {
        self?: string;
        next?: string;
        previous?: string;
      };
    };
    dictionaries?: any;
  }

  export class Amadeus {
    constructor(config: AmadeusConfig);
    shopping: {
      flightOffersSearch: {
        get(params: FlightSearchParams): Promise<AmadeusResponse>;
      };
      flightOffers: {
        pricing: {
          post(body: string): Promise<AmadeusResponse>;
        };
      };
    };
    booking: {
      flightOrders: {
        post(body: string): Promise<AmadeusResponse>;
      };
    };
    referenceData: {
      locations: {
        get(params: any): Promise<AmadeusResponse>;
      };
    };
    travel: {
      analytics: {
        airTraffic: {
          traveled: {
            get(params: any): Promise<AmadeusResponse>;
          };
        };
      };
    };
  }

  export default Amadeus;
}
