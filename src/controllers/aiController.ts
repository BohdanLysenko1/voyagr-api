import { Response } from 'express';
import { AuthRequest, AITripRequest, FlightOffer } from '../models/types';
import { HTTP_STATUS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';
import { generateTravelChatResponse } from '../config/genkitFlows';
import { amadeus, isAmadeusConfigured } from '../config/amadeus';

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

    // Simulate AI processing time
    const processingDelay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    // Generate mock AI response based on the request
    const response = {
      message: generateAIResponse(requestData),
      suggestions: generateSuggestions(requestData),
      itinerary: generateItinerary(requestData),
      estimatedBudget: calculateEstimatedBudget(requestData),
      origin: originCity,
      metadata: {
        processingTime: Math.round(processingDelay),
        model: 'voyagr-ai-v1',
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

        // Check if Amadeus is configured
        if (!isAmadeusConfigured()) {
          res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
              message: "I'd love to search for flights for you, but the flight search service isn't configured yet. Please ask your administrator to add Amadeus API credentials.",
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

        try {
          // Search for flights using Amadeus
          const flightParams: {
            originLocationCode: any;
            destinationLocationCode: any;
            departureDate: any;
            adults: any;
            max: number;
            returnDate?: any;
          } = {
            originLocationCode: aiResponse.parameters.origin,
            destinationLocationCode: aiResponse.parameters.destination,
            departureDate: aiResponse.parameters.departureDate,
            adults: aiResponse.parameters.adults || 1,
            max: 5,
          };

          if (aiResponse.parameters.returnDate) {
            flightParams.returnDate = aiResponse.parameters.returnDate;
          }

          const flightResponse = await amadeus().shopping.flightOffersSearch.get(flightParams);

          // Format flights for display with proper typing
          const flights: FlightOffer[] = flightResponse.data.slice(0, 5).map((offer: any) => {
            const outbound = offer.itineraries[0];
            const firstSegment = outbound.segments[0];
            const lastSegment = outbound.segments[outbound.segments.length - 1];

            // Calculate duration in a more robust way
            const durationString = outbound.duration 
              ? parseDuration(outbound.duration) 
              : 'N/A';

            // Extract cabin class from traveler pricings
            const cabinClass = offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY';
            
            // Get available seats
            const availableSeats = offer.numberOfBookableSeats || null;

            // Parse departure and arrival dates
            const departureDateTime = new Date(firstSegment.departure.at);
            const arrivalDateTime = new Date(lastSegment.arrival.at);

            return {
              id: offer.id,
              airline: firstSegment.carrierCode,
              flightNumber: `${firstSegment.carrierCode}${firstSegment.number}`,
              origin: firstSegment.departure.iataCode,
              destination: lastSegment.arrival.iataCode,
              departureTime: departureDateTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }),
              arrivalTime: arrivalDateTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }),
              departureDate: departureDateTime.toISOString().split('T')[0],
              arrivalDate: arrivalDateTime.toISOString().split('T')[0],
              price: {
                amount: parseFloat(offer.price.total) || 0,
                currency: offer.price.currency || 'USD',
              },
              stops: outbound.segments.length - 1,
              duration: durationString,
              class: cabinClass,
              availableSeats: availableSeats,
            };
          });

          res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
              message: `Great! I found ${flights.length} flights from ${aiResponse.parameters.origin} to ${aiResponse.parameters.destination}. Here are the best options:`,
              flights,
              interactive: {
                type: 'flight-results',
                flights,
              },
              metadata: {
                model: 'gemini-2.5-flash',
                userId: userId || 'anonymous',
                timestamp: new Date().toISOString(),
                function_call: 'search_flights',
              },
            },
            message: 'Flight search completed successfully',
          });
          return;
        } catch (flightError: any) {
          console.error('❌ Error searching flights:', flightError);
          res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
              message: `I encountered an issue while searching for flights: ${flightError.message}. Please check that the airport codes and dates are correct, or try again.`,
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

    // If it's a Genkit/API error, provide a fallback response
    if (error.message?.includes('API') || error.message?.includes('genkit')) {
      console.warn('Genkit error, falling back to mock response');
      const mockResponse = generateMockChatResponse(req.body.message || '', req.body.chatHistory, req.body.userLocation);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: mockResponse,
          metadata: {
            model: 'mock-fallback',
            userId: req.user?.uid || 'anonymous',
            timestamp: new Date().toISOString(),
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