import { Response } from 'express';
import { AuthRequest, AITripRequest, FlightOffer } from '../models/types';
import { HTTP_STATUS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';
import { generateTravelChatResponse } from '../config/genkitFlows';
import * as serpApiService from '../services/serpApiService';
import { SerpPlaceResult, SerpFlightResult } from '../services/serpApiService';

/**
 * AI Trip Planning endpoint
 * WORKFLOW: 1) Ask for origin location FIRST, 2) Then generate itinerary
 */
export const planTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid; // Optional auth
    const requestData: AITripRequest = req.body;

    // STEP 1: Check if we have origin location (FIRST QUESTION)
    if (!requestData.origin && !requestData.originLocation) {
      // Ask for origin location as the FIRST question - even before destination
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: "To help you plan the perfect trip, I'd like to know where you're traveling from.",
          requestOriginLocation: true,
          step: 'request_origin',
          actions: [
            {
              type: 'location_auto',
              label: 'Find Me',
              description: 'Auto-detect your current location'
            },
            {
              type: 'location_manual',
              label: 'Manual Entry',
              description: 'Type in your city or airport'
            }
          ],
          metadata: {
            model: 'voyagr-trip-planner',
            userId: userId || 'anonymous',
            timestamp: new Date().toISOString(),
          },
        },
        message: 'Please provide origin location first',
      });
      return;
    }

    // STEP 2: Origin provided - now we can plan the trip
    const originCity = requestData.origin || requestData.originLocation?.city || 'your location';
    console.log('📍 Origin location provided:', originCity);

    // Check if destination is provided
    if (!requestData.destination) {
      // If user provided origin but no destination, ask for destination
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: `Perfect! You're traveling from ${originCity}. 🎉

Now, **where would you like to go?**

Tell me your dream destination, and I'll create a personalized itinerary for you!

You can also include:
• Travel dates (if you know them)
• Budget range
• Number of travelers
• Your interests (culture, food, adventure, relaxation, etc.)

Example: "I want to visit Paris for 5 days in December with a budget of $3000"`,
          origin: originCity,
          step: 'request_destination',
          requestOriginLocation: false,
          metadata: {
            model: 'voyagr-trip-planner',
            userId: userId || 'anonymous',
            timestamp: new Date().toISOString(),
          },
        },
        message: 'Origin received, now need destination',
      });
      return;
    }

    // STEP 3: Both origin and destination provided - generate full itinerary
    console.log(`🗺️  Planning trip from ${originCity} to ${requestData.destination}`);

    const startTime = Date.now();

    // Fetch real data from SERP API (if configured) or use fallback mocks
    let restaurants: SerpPlaceResult[] = [];
    let attractions: SerpPlaceResult[] = [];
    let hotels: SerpPlaceResult[] = [];
    let flights: SerpFlightResult[] = [];
    let usedSerpApi = false;

    if (serpApiService.isSerpApiConfigured()) {
      console.log('🔌 SERP API configured - fetching real data');
      usedSerpApi = true;

      try {
        // Fetch all data in parallel for better performance
        // Each API call now includes all relevant request parameters to ensure cache keys are specific
        const [restaurantsResult, attractionsResult, hotelsResult, flightsResult] = await Promise.allSettled([
          serpApiService.searchRestaurants(requestData.destination, {
            cuisine: requestData.interests?.includes('food') ? 'local' : undefined,
            priceLevel: requestData.budget === 'budget' ? '$' : requestData.budget === 'luxury' ? '$$$' : '$$',
            limit: 10,
          }),
          serpApiService.searchAttractions(requestData.destination, {
            interests: requestData.interests || [],
            limit: 15,
          }),
          serpApiService.searchHotels(requestData.destination, {
            checkIn: requestData.dates?.start,
            checkOut: requestData.dates?.end,
            budget: requestData.budget === 'budget' ? 100 : requestData.budget === 'luxury' ? 500 : 200,
            limit: 8,
          }),
          requestData.dates?.start
            ? serpApiService.searchFlights(
                getAirportCode(originCity),
                getAirportCode(requestData.destination),
                requestData.dates.start,
                requestData.dates?.end,
                {
                  adults: requestData.travelers || 1,
                  children: 0,
                  cabinClass: getBudgetCabinClass(requestData.budget),
                  limit: 8,
                }
              )
            : Promise.resolve([]),
        ]);

        // Extract successful results
        restaurants = restaurantsResult.status === 'fulfilled' ? restaurantsResult.value : [];
        attractions = attractionsResult.status === 'fulfilled' ? attractionsResult.value : [];
        hotels = hotelsResult.status === 'fulfilled' ? hotelsResult.value : [];
        flights = flightsResult.status === 'fulfilled' ? flightsResult.value : [];

        console.log(`✅ SERP data fetched for request:`, {
          destination: requestData.destination,
          interests: requestData.interests,
          dates: requestData.dates,
          travelers: requestData.travelers,
          results: {
            restaurants: restaurants.length,
            attractions: attractions.length,
            hotels: hotels.length,
            flights: flights.length,
          }
        });
      } catch (error) {
        console.error('⚠️  SERP API error, falling back to mock data:', error);
        usedSerpApi = false;
      }
    }

    // If SERP API not configured or failed, use mock data as fallback
    if (!usedSerpApi || (restaurants.length === 0 && attractions.length === 0)) {
      console.log('📝 Using mock data (SERP API not configured or failed)');
    }

    const processingTime = Date.now() - startTime;

    // Generate AI response based on the request and real/mock data
    const response = {
      message: generateAIResponse(requestData),
      suggestions: usedSerpApi
        ? generateSuggestionsFromSerpData(restaurants, attractions, hotels)
        : generateSuggestions(requestData),
      itinerary: usedSerpApi
        ? generateItineraryFromSerpData(requestData, attractions, restaurants)
        : generateItinerary(requestData),
      flights: flights.length > 0 ? flights : undefined,
      hotels: hotels.length > 0 ? hotels : undefined,
      restaurants: restaurants.length > 0 ? restaurants : undefined,
      attractions: attractions.length > 0 ? attractions : undefined,
      estimatedBudget: calculateEstimatedBudget(requestData),
      origin: originCity,
      metadata: {
        processingTime,
        model: usedSerpApi ? 'voyagr-ai-v1-serp' : 'voyagr-ai-v1-mock',
        dataSource: usedSerpApi ? 'serp_api' : 'mock',
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString(),
      },
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: response,
      message: 'Trip plan generated successfully',
    });
  } catch (error: any) {
    console.error('AI plan trip error:', error);
    throw new AppError('Failed to generate trip plan', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Generate AI response based on user input
 */
function generateAIResponse(request: AITripRequest): string {
  const { origin, originLocation, destination, message, budget, travelers } = request;

  // Get origin city name
  const originCity = origin || originLocation?.city || 'your location';

  const responses = [
    `Perfect! Planning your trip from ${originCity}${destination ? ` to ${destination}` : ''}! Based on your request "${message}", I can create a personalized itinerary that matches your preferences.`,
    `Great! I see you're traveling from ${originCity}${destination ? ` to ${destination}` : ''}. Let me help you plan an unforgettable journey. From your message "${message}", I understand what you're looking for.`,
    `Excellent! Starting from ${originCity}${destination ? ` heading to ${destination}` : ''}, I'll help you with your travel plans. Based on "${message}", I can suggest some amazing experiences.`,
  ];

  let response = responses[Math.floor(Math.random() * responses.length)];

  if (budget) {
    response += ` I'll keep your budget of ${budget} in mind while creating recommendations.`;
  }

  if (travelers && travelers > 1) {
    response += ` This will be a great trip for your group of ${travelers} travelers!`;
  }

  return response;
}

/**
 * Generate travel suggestions
 */
function generateSuggestions(request: AITripRequest): any[] {
  return [
    {
      type: 'activity',
      title: 'Local Cultural Experience',
      description: 'Immerse yourself in authentic local culture with guided tours and experiences.',
      estimatedCost: '$50-150 per person',
      duration: '2-4 hours',
    },
    {
      type: 'dining',
      title: 'Culinary Tour',
      description: 'Explore the local food scene with recommendations for must-try restaurants.',
      estimatedCost: '$30-100 per meal',
      duration: 'Varies',
    },
    {
      type: 'accommodation',
      title: 'Recommended Hotels',
      description: 'Hand-picked accommodations that match your style and budget.',
      estimatedCost: request.budget || '$100-300 per night',
      duration: 'Throughout stay',
    },
  ];
}

/**
 * Generate sample itinerary
 */
function generateItinerary(request: AITripRequest): any {
  const days = request.dates
    ? Math.ceil((new Date(request.dates.end).getTime() - new Date(request.dates.start).getTime()) / (1000 * 60 * 60 * 24))
    : 5;

  const itinerary = [];

  for (let day = 1; day <= Math.min(days, 7); day++) {
    itinerary.push({
      day,
      date: request.dates
        ? new Date(new Date(request.dates.start).getTime() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null,
      activities: [
        {
          time: '09:00',
          title: `Morning Activity - Day ${day}`,
          description: 'Start your day with an exciting local experience.',
          duration: '2-3 hours',
        },
        {
          time: '12:00',
          title: 'Lunch',
          description: 'Recommended local restaurant with authentic cuisine.',
          duration: '1-2 hours',
        },
        {
          time: '14:00',
          title: `Afternoon Exploration - Day ${day}`,
          description: 'Discover hidden gems and popular attractions.',
          duration: '3-4 hours',
        },
        {
          time: '19:00',
          title: 'Dinner & Evening',
          description: 'Enjoy dinner and optional evening entertainment.',
          duration: '2-3 hours',
        },
      ],
    });
  }

  return {
    days: itinerary.length,
    dailyPlan: itinerary,
  };
}

/**
 * Generate suggestions from real SERP data
 */
function generateSuggestionsFromSerpData(
  restaurants: SerpPlaceResult[],
  attractions: SerpPlaceResult[],
  hotels: SerpPlaceResult[]
): any[] {
  const suggestions: any[] = [];

  // Add dining suggestion if we have restaurants
  if (restaurants.length > 0) {
    const topRestaurants = restaurants.slice(0, 3);
    suggestions.push({
      type: 'dining',
      title: 'Culinary Experiences',
      description: `Explore ${topRestaurants.length} highly-rated restaurants including ${topRestaurants[0].name}${topRestaurants[1] ? ` and ${topRestaurants[1].name}` : ''}.`,
      estimatedCost: topRestaurants[0].priceLevel || '$30-100 per meal',
      duration: 'Varies',
      data: topRestaurants,
    });
  }

  // Add activity suggestion if we have attractions
  if (attractions.length > 0) {
    const topAttractions = attractions.slice(0, 3);
    suggestions.push({
      type: 'activity',
      title: 'Must-See Attractions',
      description: `Visit popular attractions including ${topAttractions[0].name}${topAttractions[1] ? ` and ${topAttractions[1].name}` : ''}.`,
      estimatedCost: '$50-150 per person',
      duration: '2-4 hours each',
      data: topAttractions,
    });
  }

  // Add accommodation suggestion if we have hotels
  if (hotels.length > 0) {
    const topHotels = hotels.slice(0, 3);
    suggestions.push({
      type: 'accommodation',
      title: 'Recommended Hotels',
      description: `Stay at top-rated accommodations like ${topHotels[0].name}${topHotels[1] ? ` or ${topHotels[1].name}` : ''}.`,
      estimatedCost: topHotels[0].priceLevel || '$100-300 per night',
      duration: 'Throughout stay',
      data: topHotels,
    });
  }

  return suggestions;
}

/**
 * Generate itinerary from real SERP data
 */
function generateItineraryFromSerpData(
  request: AITripRequest,
  attractions: SerpPlaceResult[],
  restaurants: SerpPlaceResult[]
): any {
  const days = request.dates
    ? Math.ceil((new Date(request.dates.end).getTime() - new Date(request.dates.start).getTime()) / (1000 * 60 * 60 * 24))
    : 5;

  const itinerary = [];

  for (let day = 1; day <= Math.min(days, 7); day++) {
    // Distribute attractions across days
    const dayAttractions = attractions.slice((day - 1) * 2, day * 2);
    const morningAttraction = dayAttractions[0];
    const afternoonAttraction = dayAttractions[1];

    // Distribute restaurants across days
    const lunchSpot = restaurants[day - 1];
    const dinnerSpot = restaurants[day + 6] || restaurants[day] || restaurants[0];

    itinerary.push({
      day,
      date: request.dates
        ? new Date(new Date(request.dates.start).getTime() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null,
      activities: [
        {
          time: '09:00',
          title: morningAttraction?.name || `Morning Activity - Day ${day}`,
          description: morningAttraction?.description || 'Start your day with an exciting local experience.',
          location: morningAttraction?.address,
          rating: morningAttraction?.rating,
          duration: '2-3 hours',
        },
        {
          time: '12:00',
          title: lunchSpot ? `Lunch at ${lunchSpot.name}` : 'Lunch',
          description: lunchSpot?.description || 'Recommended local restaurant with authentic cuisine.',
          location: lunchSpot?.address,
          rating: lunchSpot?.rating,
          priceLevel: lunchSpot?.priceLevel,
          duration: '1-2 hours',
        },
        {
          time: '14:00',
          title: afternoonAttraction?.name || `Afternoon Exploration - Day ${day}`,
          description: afternoonAttraction?.description || 'Discover hidden gems and popular attractions.',
          location: afternoonAttraction?.address,
          rating: afternoonAttraction?.rating,
          duration: '3-4 hours',
        },
        {
          time: '19:00',
          title: dinnerSpot ? `Dinner at ${dinnerSpot.name}` : 'Dinner & Evening',
          description: dinnerSpot?.description || 'Enjoy dinner and optional evening entertainment.',
          location: dinnerSpot?.address,
          rating: dinnerSpot?.rating,
          priceLevel: dinnerSpot?.priceLevel,
          duration: '2-3 hours',
        },
      ],
    });
  }

  return {
    days: itinerary.length,
    dailyPlan: itinerary,
  };
}

/**
 * Calculate estimated budget
 */
function calculateEstimatedBudget(request: AITripRequest): any {
  const baseDailyCost = 150;
  const days = request.dates
    ? Math.ceil((new Date(request.dates.end).getTime() - new Date(request.dates.start).getTime()) / (1000 * 60 * 60 * 24))
    : 5;
  const travelers = request.travelers || 1;

  return {
    accommodation: `$${100 * days}-${250 * days}`,
    food: `$${50 * days * travelers}-${100 * days * travelers}`,
    activities: `$${50 * days * travelers}-${150 * days * travelers}`,
    transportation: `$${30 * days}-${80 * days}`,
    total: `$${(100 + 50 + 50 + 30) * days * travelers}-${(250 + 100 + 150 + 80) * days * travelers}`,
    currency: 'USD',
    perPerson: travelers > 1,
  };
}

/**
 * AI Chat endpoint using Google Genkit
 * Handles conversational chat for travel assistance
 */
export const chat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    const { message, chatHistory, context, userLocation } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('Message is required', HTTP_STATUS.BAD_REQUEST);
    }

    // If user provided location data, enhance the context
    let enhancedContext = context;
    if (userLocation) {
      const locationInfo = `User's current location: ${userLocation.city || 'Unknown City'}, ${userLocation.country || 'Unknown Country'}${userLocation.latitude && userLocation.longitude ? ` (Coordinates: ${userLocation.latitude}, ${userLocation.longitude})` : ''}`;
      enhancedContext = enhancedContext ? `${enhancedContext}\n${locationInfo}` : locationInfo;
      console.log('📍 User location detected:', locationInfo);
    }

    // Debug: Log API key status
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    console.log('🔑 API Key Status:', apiKey ? `Found (${apiKey.substring(0, 10)}...)` : 'NOT FOUND');

    // Check if Google AI API key is configured
    if (!apiKey) {
      console.warn('Google AI API key not configured, using mock response');

      // Fallback to mock response if API key is not configured
      const mockResponse = generateMockChatResponse(message, chatHistory, userLocation);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: mockResponse,
          metadata: {
            model: 'mock-fallback',
            userId: userId || 'anonymous',
            timestamp: new Date().toISOString(),
          },
        },
        message: 'Chat response generated (mock mode)',
      });
      return;
    }

    // Generate response using Google Genkit
    const aiResponse = await generateTravelChatResponse(
      message,
      chatHistory || [],
      enhancedContext
    );

    // Check if AI wants to call a function (e.g., search flights)
    if (typeof aiResponse === 'object' && aiResponse.type === 'function_call') {
      if (aiResponse.function === 'search_flights') {
        console.log('🛫 AI requested flight search:', aiResponse.parameters);

        // Flight search service is not available
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: {
            message: "I'd love to search for flights for you, but the flight search service isn't currently available. Please try using a dedicated flight booking service.",
            metadata: {
              model: 'gemini-2.5-flash',
              userId: userId || 'anonymous',
              timestamp: new Date().toISOString(),
            },
          },
          message: 'Chat response generated successfully',
        });
        return;
      }
    }

    // Regular text response
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        message: aiResponse as string,
        metadata: {
          model: 'gemini-2.5-flash',
          userId: userId || 'anonymous',
          timestamp: new Date().toISOString(),
        },
      },
      message: 'Chat response generated successfully',
    });
  } catch (error: any) {
    console.error('AI chat error:', error);

    // Check if it's a Google AI API error (overloaded, rate limit, network issue, etc.)
    const isGoogleAIError = 
      error.constructor?.name === 'GoogleGenerativeAIFetchError' ||
      error.status === 503 ||
      error.status === 429 ||
      error.message?.includes('GoogleGenerativeAI') ||
      error.message?.includes('API') || 
      error.message?.includes('genkit') ||
      error.message?.includes('overloaded') ||
      error.message?.includes('rate limit');

    if (isGoogleAIError) {
      const errorReason = error.status === 503 
        ? 'The AI service is temporarily overloaded' 
        : error.status === 429 
          ? 'Rate limit exceeded' 
          : 'The AI service is temporarily unavailable';

      console.warn(`⚠️  ${errorReason}, falling back to mock response`);
      
      const mockResponse = generateMockChatResponse(req.body.message || '', req.body.chatHistory, req.body.userLocation);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: mockResponse,
          metadata: {
            model: 'mock-fallback',
            userId: req.user?.uid || 'anonymous',
            timestamp: new Date().toISOString(),
            fallbackReason: errorReason,
          },
        },
        message: 'Chat response generated (fallback mode)',
      });
      return;
    }

    throw new AppError('Failed to generate chat response', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Parse ISO 8601 duration format (e.g., "PT25H30M") to human-readable string
 */
function parseDuration(duration: string): string {
  try {
    // Remove 'PT' prefix and parse hours and minutes
    const timeString = duration.replace('PT', '');
    const hoursMatch = timeString.match(/(\d+)H/);
    const minutesMatch = timeString.match(/(\d+)M/);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    
    return `${hours}h ${minutes}m`;
  } catch (error) {
    console.error('Error parsing duration:', error);
    return 'N/A';
  }
}

/**
 * Get popular travel destination countries using Genkit
 */
export const getPopularCountries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      // Fallback to hardcoded popular countries
      const fallbackCountries = getFallbackPopularCountries();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          countries: fallbackCountries,
          metadata: {
            model: 'fallback',
            timestamp: new Date().toISOString(),
          },
        },
      });
      return;
    }

    // Use Genkit to get popular countries
    const prompt = `List exactly 5 of the most popular international travel destination countries right now.
    Consider factors like tourism popularity, accessibility, and variety of experiences.
    Return ONLY a JSON array of country names, nothing else. Format: ["Country1", "Country2", "Country3", "Country4", "Country5"]
    Use full country names (e.g., "United States" not "USA").`;

    const aiResponse = await generateTravelChatResponse(prompt, [], '');

    // Parse the response - it should be a JSON array
    let countries: string[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = aiResponse.toString().match(/\[.*\]/s);
      if (jsonMatch) {
        countries = JSON.parse(jsonMatch[0]);
        // Ensure we have exactly 5 countries
        if (countries.length !== 5) {
          countries = getFallbackPopularCountries();
        }
      } else {
        // Fallback if parsing fails
        countries = getFallbackPopularCountries();
      }
    } catch (parseError) {
      console.error('Failed to parse AI response, using fallback:', parseError);
      countries = getFallbackPopularCountries();
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        countries,
        metadata: {
          model: 'gemini-2.5-flash',
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Get popular countries error:', error);

    // Fallback to hardcoded countries on error
    const fallbackCountries = getFallbackPopularCountries();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        countries: fallbackCountries,
        metadata: {
          model: 'fallback',
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
};

/**
 * Get popular cities for a country using Genkit
 */
export const getPopularCities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { country } = req.body;

    if (!country || typeof country !== 'string' || country.trim().length === 0) {
      throw new AppError('Country is required', HTTP_STATUS.BAD_REQUEST);
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      // Fallback to hardcoded popular cities
      const fallbackCities = getFallbackPopularCities(country);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          cities: fallbackCities,
          metadata: {
            model: 'fallback',
            timestamp: new Date().toISOString(),
          },
        },
        message: `Found ${fallbackCities.length} popular cities`,
      });
      return;
    }

    // Use Genkit to get popular cities
    const prompt = `List the top 5 most popular tourist cities in ${country}.
    Return ONLY a JSON array of city names, nothing else. Format: ["City1", "City2", "City3", "City4", "City5"]
    Make sure they are actual tourist destinations people would want to visit.`;

    const aiResponse = await generateTravelChatResponse(prompt, [], '');

    // Parse the response - it should be a JSON array
    let cities: string[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = aiResponse.toString().match(/\[.*\]/s);
      if (jsonMatch) {
        cities = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if parsing fails
        cities = getFallbackPopularCities(country);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response, using fallback:', parseError);
      cities = getFallbackPopularCities(country);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        cities,
        metadata: {
          model: 'gemini-2.5-flash',
          timestamp: new Date().toISOString(),
        },
      },
      message: `Found ${cities.length} popular cities`,
    });
  } catch (error: any) {
    console.error('Get popular cities error:', error);

    // Fallback to hardcoded cities on error
    const fallbackCities = getFallbackPopularCities(req.body.country || '');
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        cities: fallbackCities,
        metadata: {
          model: 'fallback',
          timestamp: new Date().toISOString(),
        },
      },
      message: `Found ${fallbackCities.length} popular cities (fallback)`,
    });
  }
};

/**
 * Get fallback popular countries for travel
 */
function getFallbackPopularCountries(): string[] {
  return ['France', 'Italy', 'Japan', 'Spain', 'United States'];
}

/**
 * Get fallback popular cities for common countries
 */
function getFallbackPopularCities(country: string): string[] {
  const normalizedCountry = country.toLowerCase().trim();

  const cityMap: Record<string, string[]> = {
    'france': ['Paris', 'Nice', 'Lyon', 'Marseille', 'Bordeaux'],
    'japan': ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Fukuoka'],
    'italy': ['Rome', 'Venice', 'Florence', 'Milan', 'Naples'],
    'spain': ['Barcelona', 'Madrid', 'Seville', 'Valencia', 'Granada'],
    'usa': ['New York', 'Los Angeles', 'Las Vegas', 'Miami', 'San Francisco'],
    'united states': ['New York', 'Los Angeles', 'Las Vegas', 'Miami', 'San Francisco'],
    'uk': ['London', 'Edinburgh', 'Manchester', 'Liverpool', 'Oxford'],
    'united kingdom': ['London', 'Edinburgh', 'Manchester', 'Liverpool', 'Oxford'],
    'germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
    'thailand': ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', 'Krabi'],
    'australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    'canada': ['Toronto', 'Vancouver', 'Montreal', 'Quebec City', 'Calgary'],
    'mexico': ['Mexico City', 'Cancun', 'Playa del Carmen', 'Guadalajara', 'Tulum'],
    'brazil': ['Rio de Janeiro', 'São Paulo', 'Salvador', 'Brasília', 'Florianópolis'],
    'greece': ['Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes'],
    'portugal': ['Lisbon', 'Porto', 'Faro', 'Madeira', 'Évora'],
    'netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Maastricht'],
    'switzerland': ['Zurich', 'Geneva', 'Lucerne', 'Bern', 'Interlaken'],
    'austria': ['Vienna', 'Salzburg', 'Innsbruck', 'Graz', 'Hallstatt'],
    'turkey': ['Istanbul', 'Antalya', 'Cappadocia', 'Izmir', 'Bodrum'],
  };

  return cityMap[normalizedCountry] || ['Capital City', 'City 1', 'City 2', 'City 3', 'City 4'];
}

/**
 * Convert budget preference to flight cabin class
 * Used for flight searches to match user's budget expectations
 */
function getBudgetCabinClass(budget?: string): 'economy' | 'premium_economy' | 'business' | 'first' {
  if (!budget) return 'economy';
  
  const normalized = budget.toLowerCase().trim();
  
  switch (normalized) {
    case 'budget':
    case 'cheap':
    case 'low':
      return 'economy';
    
    case 'moderate':
    case 'mid':
    case 'medium':
      return 'premium_economy';
    
    case 'luxury':
    case 'high':
    case 'premium':
      return 'business';
    
    case 'first':
    case 'first class':
      return 'first';
    
    default:
      return 'economy';
  }
}

/**
 * Convert city/country name to primary airport code
 * Used for flight searches which require IATA codes
 */
function getAirportCode(location: string): string {
  if (!location) return location;
  
  const normalized = location.toLowerCase().trim();
  
  // Airport code mapping for major cities and destinations
  const airportMap: Record<string, string> = {
    // Major US Cities
    'new york': 'JFK',
    'new york city': 'JFK',
    'nyc': 'JFK',
    'los angeles': 'LAX',
    'la': 'LAX',
    'chicago': 'ORD',
    'houston': 'IAH',
    'phoenix': 'PHX',
    'philadelphia': 'PHL',
    'san antonio': 'SAT',
    'san diego': 'SAN',
    'dallas': 'DFW',
    'san jose, ca': 'SJC',
    'austin': 'AUS',
    'jacksonville': 'JAX',
    'fort worth': 'DFW',
    'san francisco': 'SFO',
    'seattle': 'SEA',
    'denver': 'DEN',
    'washington': 'DCA',
    'washington dc': 'DCA',
    'boston': 'BOS',
    'atlanta': 'ATL',
    'miami': 'MIA',
    'las vegas': 'LAS',
    'orlando': 'MCO',
    
    // Europe
    'london': 'LHR',
    'paris': 'CDG',
    'france': 'CDG',
    'rome': 'FCO',
    'italy': 'FCO',
    'madrid': 'MAD',
    'spain': 'MAD',
    'barcelona': 'BCN',
    'berlin': 'BER',
    'germany': 'FRA',
    'frankfurt': 'FRA',
    'munich': 'MUC',
    'amsterdam': 'AMS',
    'netherlands': 'AMS',
    'zurich': 'ZRH',
    'switzerland': 'ZRH',
    'vienna': 'VIE',
    'austria': 'VIE',
    'brussels': 'BRU',
    'belgium': 'BRU',
    'dublin': 'DUB',
    'ireland': 'DUB',
    'lisbon': 'LIS',
    'portugal': 'LIS',
    'copenhagen': 'CPH',
    'denmark': 'CPH',
    'stockholm': 'ARN',
    'sweden': 'ARN',
    'oslo': 'OSL',
    'norway': 'OSL',
    'athens': 'ATH',
    'greece': 'ATH',
    'istanbul': 'IST',
    'turkey': 'IST',
    'moscow': 'SVO',
    'russia': 'SVO',
    'prague': 'PRG',
    'czech republic': 'PRG',
    'warsaw': 'WAW',
    'poland': 'WAW',
    'budapest': 'BUD',
    'hungary': 'BUD',
    
    // Asia
    'tokyo': 'NRT',
    'japan': 'NRT',
    'beijing': 'PEK',
    'china': 'PEK',
    'shanghai': 'PVG',
    'hong kong': 'HKG',
    'singapore': 'SIN',
    'dubai': 'DXB',
    'uae': 'DXB',
    'united arab emirates': 'DXB',
    'bangkok': 'BKK',
    'thailand': 'BKK',
    'kuala lumpur': 'KUL',
    'malaysia': 'KUL',
    'seoul': 'ICN',
    'south korea': 'ICN',
    'taipei': 'TPE',
    'taiwan': 'TPE',
    'manila': 'MNL',
    'philippines': 'MNL',
    'jakarta': 'CGK',
    'indonesia': 'CGK',
    'delhi': 'DEL',
    'india': 'DEL',
    'mumbai': 'BOM',
    
    // Middle East
    'abu dhabi': 'AUH',
    'doha': 'DOH',
    'qatar': 'DOH',
    'riyadh': 'RUH',
    'saudi arabia': 'RUH',
    'tel aviv': 'TLV',
    'israel': 'TLV',
    'cairo': 'CAI',
    'egypt': 'CAI',
    
    // South America
    'buenos aires': 'EZE',
    'argentina': 'EZE',
    'são paulo': 'GRU',
    'sao paulo': 'GRU',
    'brazil': 'GRU',
    'rio de janeiro': 'GIG',
    'lima': 'LIM',
    'peru': 'LIM',
    'bogota': 'BOG',
    'colombia': 'BOG',
    'santiago': 'SCL',
    'chile': 'SCL',
    
    // Oceania
    'sydney': 'SYD',
    'australia': 'SYD',
    'melbourne': 'MEL',
    'brisbane': 'BNE',
    'perth': 'PER',
    'auckland': 'AKL',
    'new zealand': 'AKL',
    
    // Africa
    'johannesburg': 'JNB',
    'south africa': 'JNB',
    'cape town': 'CPT',
    'nairobi': 'NBO',
    'kenya': 'NBO',
    'lagos': 'LOS',
    'nigeria': 'LOS',
    'casablanca': 'CMN',
    'morocco': 'CMN',
    
    // Canada
    'toronto': 'YYZ',
    'canada': 'YYZ',
    'vancouver': 'YVR',
    'montreal': 'YUL',
    'calgary': 'YYC',
    
    // Mexico & Central America
    'mexico city': 'MEX',
    'mexico': 'MEX',
    'cancun': 'CUN',
    'guadalajara': 'GDL',
    'monterrey': 'MTY',
    'san jose': 'SJO',
    'costa rica': 'SJO',
    'panama city': 'PTY',
    'panama': 'PTY',
  };
  
  // Check if it's already an airport code (3 letters, uppercase)
  if (/^[A-Z]{3}$/.test(location)) {
    return location;
  }
  
  // Try to find airport code from mapping
  const airportCode = airportMap[normalized];
  if (airportCode) {
    return airportCode;
  }
  
  // If not found in mapping, return the original (might be an airport code or small city)
  return location.toUpperCase();
}

/**
 * Generate mock chat response for fallback
 */
function generateMockChatResponse(message: string, chatHistory?: any[], userLocation?: any): string {
  // First message - enthusiastic welcome
  if (!chatHistory || chatHistory.length === 0) {
    const greetings = [
      `Hey there! 👋 Welcome to Voyagr! I'm your travel buddy who's basically been everywhere and loves helping people discover amazing places. What's on your mind - got a trip you're dreaming about?`,
      `Ooh, hello! ✈️ So you're thinking about travel - I love it! I've been all over the world and nothing makes me happier than helping someone plan an epic adventure. What are you curious about?`,
      `Hey! Welcome aboard! 🌍 I'm that friend who always has travel recommendations and probably too many stories. What's calling to you right now - beach paradise, mountain adventure, city exploration?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // If location is provided, acknowledge it naturally
  if (userLocation && chatHistory.length <= 2) {
    const cityName = userLocation.city || 'your city';
    return `Awesome, you're in ${cityName}! That's a great starting point for planning. So what's got you thinking about travel - specific destination in mind, or are you still in the dreaming phase? Either way, I'm here to help make it happen! ✨`;
  }

  // Regular conversational responses - match the energy
  const responses = [
    `Ooh okay, "${message}" - I like where this is going! Let me share what I know about that. What specifically are you most curious about?`,
    `"${message}" - great question! Alright, here's the thing about that... What's your vibe - are you looking for the tourist highlights or the local secrets?`,
    `Love it! So about "${message}"... I've got some solid intel on that. Are you more budget-conscious or looking to splurge a bit?`,
    `Okay so "${message}" - I actually have some experience with this! Quick question though: what kind of traveler are you? Adventure seeker, food enthusiast, culture vulture, or all of the above?`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}