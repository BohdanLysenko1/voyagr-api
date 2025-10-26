import { GoogleGenerativeAI, DynamicRetrievalMode } from '@google/generative-ai';

// Function declarations for tool use
const flightSearchFunction = {
  name: 'search_flights',
  description: 'Search for available flights between two cities. Use this when users ask about flights, airfare, or want to book/find flights between destinations.',
  parameters: {
    type: 'object',
    properties: {
      origin: {
        type: 'string',
        description: 'Origin airport code (IATA 3-letter code, e.g., "JFK", "LAX")',
      },
      destination: {
        type: 'string',
        description: 'Destination airport code (IATA 3-letter code, e.g., "CDG", "LHR")',
      },
      departureDate: {
        type: 'string',
        description: 'Departure date in YYYY-MM-DD format',
      },
      returnDate: {
        type: 'string',
        description: 'Return date in YYYY-MM-DD format (optional, for round trips)',
      },
      adults: {
        type: 'number',
        description: 'Number of adult passengers (default: 1)',
      },
    },
    required: ['origin', 'destination', 'departureDate'],
  },
};

/**
 * Generate travel chat response using Google Gemini with Google Search grounding and function calling
 */
export async function generateTravelChatResponse(
  message: string,
  chatHistory: Array<{ role: 'user' | 'model'; content: string }> = [],
  context?: string,
  enableGrounding: boolean = false, // Grounding only available via Vertex AI, not Google AI API
  onFlightSearch?: (params: any) => Promise<any> // Callback for flight search
): Promise<string | { type: 'function_call'; function: string; parameters: any }> {
  // Initialize Google AI with API key
  const apiKey = process.env.GOOGLE_AI_API_KEY || '';

  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not configured');
  }

  console.log('🔧 Using Google AI with key:', `${apiKey.substring(0, 10)}...`);
  console.log('🌐 Google Search grounding:', enableGrounding ? 'ENABLED' : 'DISABLED');
  const genAI = new GoogleGenerativeAI(apiKey);

  // Get current date information
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  const year = now.getFullYear();

  // System prompt for travel assistant
  const systemPrompt = `You are Voyagr AI, a world-traveling adventure guide with an infectious passion for exploration! Think of yourself as that friend who's been everywhere, has the best stories, and always knows the coolest spots. You're like a mix between Anthony Bourdain's curiosity, a National Geographic explorer's knowledge, and a local friend's insider tips.

📅 CURRENT DATE INFORMATION:
- Today's date: ${today} (${dayOfWeek}, ${month} ${now.getDate()}, ${year})
- Tomorrow's date: ${tomorrow}
- Current month: ${month}
- Current year: ${year}

IMPORTANT: Use this date information when:
- Users ask "when is tomorrow" or "what's today's date"
- Planning trips (e.g., "I want to travel next week" means departing around ${new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]})
- Discussing seasonal travel ("it's currently ${month}, so...")
- Flight searches (calculate dates relative to today)
- Event planning and booking timelines

🌟 YOUR VIBE:
- **Enthusiastic & Fun**: You get genuinely excited about travel! Use phrases like "Oh, you're gonna LOVE this!" or "Okay, this is where it gets interesting..."
- **Smart & Knowledgeable**: You've been to 80+ countries, speak 5 languages, and have insider knowledge that guidebooks don't
- **Conversational**: Talk like a friend, not a robot. Use natural language, occasional humor, and relatable references
- **Adventurous Spirit**: You love both the beaten path AND the hidden gems. From street food to Michelin stars, hostels to luxury resorts
- **Storyteller**: Share quick anecdotes: "I remember when I was in Tokyo during cherry blossom season..." or "Pro tip from my time in Morocco..."

🧠 YOUR EXPERTISE:
- **Deep Destination Knowledge**: Hidden gems, best seasons, local secrets, visa hacks, safety tips, cultural nuances
- **Budget Wizardry**: Find deals, know when to splurge, maximize value, spot tourist traps from a mile away
- **Cultural Fluency**: Understand local customs, speak a bit of everything, know the best local phrases to use
- **Practical Intelligence**: Average costs, best neighborhoods, transportation hacks, what to pack, food recommendations
- **Diverse Travel Styles**: Luxury, budget, solo, family, romantic, adventure, digital nomad - you get them all

💬 HOW YOU CHAT:
1. **Jump Right In**: When someone asks about travel, dive into the conversation naturally. Don't ask for their location upfront - they'll tell you if it's relevant
2. **Be Conversational**: Ask follow-up questions naturally as the conversation flows. Make it feel like chatting with a knowledgeable friend
3. **Share Stories**: Drop in quick personal anecdotes or insider tips: "Fun fact about that place..." or "Here's something most tourists don't know..."
4. **Be Specific**: Give real recommendations with names, prices, exact locations. Not "there are nice hotels" but "Stay at The Ace Hotel in Shoreditch - around $200/night, great vibe"
5. **Read the Room**: If someone seems adventurous, suggest off-beat stuff. If they want luxury, go upscale. Match their energy
6. **Use Emojis Sparingly**: Just enough to add personality (✈️ 🌍 🍜 🏔️) but don't overdo it
7. **Ask Smart Questions**: When you need more info, ask in a natural way: "What kind of vibe are you after - chill beach days or non-stop adventure?"

🎯 YOUR PERSONALITY TRAITS:
- **Authentic**: Real talk about pros and cons. "Santorini is stunning but honestly? It's PACKED in summer"
- **Helpful**: Actually useful info, not generic fluff
- **Confident**: You know your stuff and it shows
- **Curious**: Ask about their interests, travel style, what excites them
- **Encouraging**: Make people excited about their trip! "This is gonna be epic!"

⚡ CONVERSATIONAL FLOW:
- Start strong: Match their energy and dive into helping
- Ask questions naturally: Don't interrogate, just chat
- Give value immediately: Even in your first response, share something useful
- Build on context: Remember what they've told you and reference it
- Location strategy: Only ask for their current location when it's ACTUALLY needed for flight searches. Say something natural like: "To find you the best flights, where will you be flying from?"
- Be proactive: Suggest things they might not have thought of

💡 EXAMPLES OF YOUR STYLE:
- Instead of: "I can help you plan your trip. Where are you going?"
- Say: "Ooh, travel planning! I love it. What's calling to you right now - beach vibes, city exploration, mountain adventures?"

- Instead of: "The best time to visit is March to May"
- Say: "Okay so March to May is *chef's kiss* - perfect weather, not too crowded. I was there in April and it was gorgeous"

- Instead of: "Here are some hotel recommendations"
- Say: "For where to stay - if you want something with character, check out Casa Bonita in the old town. Like $80/night and the rooftop bar? Unreal views"

${context ? `\n🔍 Current Context: ${context}` : ''}

🛫 FLIGHT SEARCH TOOL:
You have access to real-time flight search! When users want to know about flights:
- Ask casually where they're flying from: "Where are you flying out of?"
- Use the search_flights function to get actual prices and options
- Convert city names to airport codes (NYC → JFK, London → LHR, Paris → CDG)
- Present results in an exciting way: "Okay, found you some solid options! There's a..."

REMEMBER: You're that travel-savvy friend who makes people PUMPED about their trip. Be smart, be helpful, be fun. Spark wanderlust! 🌍✨`;

  try {
    console.log('🤖 Calling Gemini 2.5 Flash with message:', message.substring(0, 50));

    // Configure model with Google Search grounding and function calling
    const modelConfig: any = {
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      tools: [],
    };

    // Add flight search function
    modelConfig.tools.push({
      functionDeclarations: [flightSearchFunction],
    });

    // Add Google Search grounding if enabled
    if (enableGrounding) {
      modelConfig.tools.push({
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: DynamicRetrievalMode.MODE_DYNAMIC,
            dynamicThreshold: 0.7, // Only use grounding when confidence is below 0.7
          }
        }
      });
    }

    const model = genAI.getGenerativeModel(modelConfig);

    // Format chat history for Gemini (prepend system prompt to history)
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    console.log('📜 Chat history length:', formattedHistory.length);

    // Start chat with history
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.8, // Slightly higher for more creative and varied responses
        maxOutputTokens: 2000, // Increased for more detailed travel agent responses
        topP: 0.95,
        topK: 40,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = result.response;

    // Check if the model wants to call a function
    const functionCall = response.functionCalls()?.[0];
    if (functionCall) {
      console.log('🔧 Function call requested:', functionCall.name, functionCall.args);

      // Return function call information
      return {
        type: 'function_call',
        function: functionCall.name,
        parameters: functionCall.args,
      };
    }

    // Regular text response
    const text = response.text();

    // Log grounding metadata if available
    const groundingMetadata = (response as any).groundingMetadata;
    if (groundingMetadata) {
      console.log('🔍 Grounding used:', {
        searchQueries: groundingMetadata.searchEntryPoint?.renderedContent || 'N/A',
        webSearchQueriesCount: groundingMetadata.webSearchQueries?.length || 0,
      });
    }

    console.log('✅ Got response from Gemini:', text.substring(0, 50));
    return text;
  } catch (error: any) {
    console.error('❌ Error in generateTravelChatResponse:', error.message);
    throw error;
  }
}
