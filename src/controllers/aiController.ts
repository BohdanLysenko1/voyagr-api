import { Response } from 'express';
import { AuthRequest, AITripRequest } from '../models/types';
import { HTTP_STATUS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';
import { generateTravelChatResponse } from '../config/genkitFlows';

/**
 * AI Trip Planning endpoint
 * This is a placeholder implementation. In production, this would integrate
 * with an AI service like OpenAI, Anthropic Claude, or a custom ML model.
 */
export const planTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid; // Optional auth
    const requestData: AITripRequest = req.body;

    // Simulate AI processing time
    const processingDelay = Math.random() * 1000 + 500; // 500-1500ms

    await new Promise(resolve => setTimeout(resolve, processingDelay));

    // Generate mock AI response based on the request
    const response = {
      message: generateAIResponse(requestData),
      suggestions: generateSuggestions(requestData),
      itinerary: generateItinerary(requestData),
      estimatedBudget: calculateEstimatedBudget(requestData),
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
  const { destination, message, budget, travelers } = request;

  const responses = [
    `I'd be happy to help you plan your trip${destination ? ` to ${destination}` : ''}! Based on your request "${message}", I can create a personalized itinerary that matches your preferences.`,
    `Great choice${destination ? ` for ${destination}` : ''}! Let me help you plan an unforgettable journey. From your message "${message}", I understand what you're looking for.`,
    `Perfect! I'll help you with your travel plans${destination ? ` to ${destination}` : ''}. Based on "${message}", I can suggest some amazing experiences.`,
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
    const { message, chatHistory, context } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('Message is required', HTTP_STATUS.BAD_REQUEST);
    }

    // Debug: Log API key status
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    console.log('🔑 API Key Status:', apiKey ? `Found (${apiKey.substring(0, 10)}...)` : 'NOT FOUND');

    // Check if Google AI API key is configured
    if (!apiKey) {
      console.warn('Google AI API key not configured, using mock response');

      // Fallback to mock response if API key is not configured
      const mockResponse = generateMockChatResponse(message);

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
      context
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        message: aiResponse,
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
      const mockResponse = generateMockChatResponse(req.body.message || '');

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
 * Generate mock chat response for fallback
 */
function generateMockChatResponse(message: string): string {
  const responses = [
    `I'd be happy to help you with "${message}"! As your travel assistant, I can provide personalized recommendations for destinations, accommodations, activities, and more. What specific aspect of your trip would you like to explore?`,
    `Great question about "${message}"! I'm here to make your travel planning easy and exciting. Let me help you discover amazing destinations and experiences that match your interests.`,
    `Thanks for asking about "${message}"! I can assist with trip planning, destination recommendations, booking suggestions, and travel tips. What would you like to know more about?`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}