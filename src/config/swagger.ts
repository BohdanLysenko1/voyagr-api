import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Voyagr API',
    version: '1.0.0',
    description: 'Comprehensive API documentation for the Voyagr travel planning platform',
    contact: {
      name: 'Voyagr API Support',
      email: 'support@voyagr.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Development server',
    },
    {
      url: 'https://api.voyagr.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Firebase JWT token. Add your Firebase auth token to authorize requests.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'An error occurred',
          },
          error: {
            type: 'string',
            example: 'Detailed error message',
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation successful',
          },
        },
      },
      CalendarEvent: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'event123',
          },
          title: {
            type: 'string',
            example: 'Flight to Paris',
          },
          description: {
            type: 'string',
            example: 'Departure from JFK',
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            example: '2025-12-01T10:00:00Z',
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            example: '2025-12-01T14:00:00Z',
          },
          location: {
            type: 'string',
            example: 'JFK Airport',
          },
          category: {
            type: 'string',
            enum: ['flight', 'hotel', 'activity', 'restaurant', 'other'],
            example: 'flight',
          },
        },
      },
      Deal: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'deal123',
          },
          title: {
            type: 'string',
            example: 'Paris Flight Deal',
          },
          description: {
            type: 'string',
            example: 'Cheap flights to Paris',
          },
          price: {
            type: 'number',
            example: 299.99,
          },
          currency: {
            type: 'string',
            example: 'USD',
          },
          destination: {
            type: 'string',
            example: 'Paris',
          },
          dealType: {
            type: 'string',
            enum: ['flight', 'hotel', 'package'],
            example: 'flight',
          },
        },
      },
      Favorite: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'fav123',
          },
          dealId: {
            type: 'string',
            example: 'deal123',
          },
          userId: {
            type: 'string',
            example: 'user123',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-11-05T12:00:00Z',
          },
        },
      },
      AITripRequest: {
        type: 'object',
        required: ['destination'],
        properties: {
          destination: {
            type: 'string',
            example: 'Paris, France',
          },
          dates: {
            type: 'object',
            properties: {
              start: {
                type: 'string',
                format: 'date',
                example: '2025-12-01',
              },
              end: {
                type: 'string',
                format: 'date',
                example: '2025-12-05',
              },
            },
          },
          budget: {
            type: 'string',
            enum: ['budget', 'moderate', 'luxury'],
            example: 'moderate',
          },
          interests: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['culture', 'food', 'history'],
          },
          travelers: {
            type: 'number',
            example: 2,
          },
        },
      },
      FlightSearchParams: {
        type: 'object',
        required: ['originLocationCode', 'destinationLocationCode', 'departureDate', 'adults'],
        properties: {
          originLocationCode: {
            type: 'string',
            example: 'JFK',
            description: 'IATA airport code for origin',
          },
          destinationLocationCode: {
            type: 'string',
            example: 'CDG',
            description: 'IATA airport code for destination',
          },
          departureDate: {
            type: 'string',
            format: 'date',
            example: '2025-12-01',
          },
          returnDate: {
            type: 'string',
            format: 'date',
            example: '2025-12-05',
            description: 'Optional for one-way flights',
          },
          adults: {
            type: 'integer',
            minimum: 1,
            example: 2,
          },
          children: {
            type: 'integer',
            minimum: 0,
            example: 0,
          },
          infants: {
            type: 'integer',
            minimum: 0,
            example: 0,
          },
          travelClass: {
            type: 'string',
            enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'],
            example: 'ECONOMY',
          },
          max: {
            type: 'integer',
            example: 10,
            description: 'Maximum number of flight offers to return',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'API health check endpoints',
    },
    {
      name: 'Calendar',
      description: 'Calendar event management (requires authentication)',
    },
    {
      name: 'Deals',
      description: 'Travel deals and offers',
    },
    {
      name: 'Favorites',
      description: 'User favorite deals (requires authentication)',
    },
    {
      name: 'AI',
      description: 'AI-powered trip planning and chat',
    },
    {
      name: 'Flights',
      description: 'Flight search and booking via Amadeus API',
    },
    {
      name: 'SERP',
      description: 'Search engine results for restaurants, attractions, hotels, and flights',
    },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/index.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
