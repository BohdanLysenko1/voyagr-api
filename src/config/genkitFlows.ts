import { GoogleGenerativeAI, DynamicRetrievalMode } from '@google/generative-ai';

/**
 * Generate travel chat response using Google Gemini with Google Search grounding
 */
export async function generateTravelChatResponse(
  message: string,
  chatHistory: Array<{ role: 'user' | 'model'; content: string }> = [],
  context?: string,
  enableGrounding: boolean = false // Grounding only available via Vertex AI, not Google AI API
): Promise<string> {
  // Initialize Google AI with API key
  const apiKey = process.env.GOOGLE_AI_API_KEY || '';

  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not configured');
  }

  console.log('🔧 Using Google AI with key:', `${apiKey.substring(0, 10)}...`);
  console.log('🌐 Google Search grounding:', enableGrounding ? 'ENABLED' : 'DISABLED');
  const genAI = new GoogleGenerativeAI(apiKey);

  // System prompt for travel assistant
  const systemPrompt = `You are Voyagr AI, a friendly and knowledgeable travel assistant. Your role is to help users plan their trips, find destinations, book accommodations, discover activities, and provide travel advice.

Key responsibilities:
- Help users plan trips with personalized recommendations
- Suggest destinations based on preferences, budget, and interests
- Provide information about flights, hotels, restaurants, and activities
- Offer travel tips and cultural insights
- Be enthusiastic, helpful, and concise in responses
- Ask clarifying questions when needed to provide better recommendations
- When providing flight information, include current prices and availability when possible

${context ? `Additional context: ${context}` : ''}

Always be warm, encouraging, and focus on making travel planning exciting and easy.`;

  try {
    console.log('🤖 Calling Gemini 2.5 Flash with message:', message.substring(0, 50));

    // Configure model with Google Search grounding
    const modelConfig: any = {
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    };

    // Add Google Search grounding if enabled
    if (enableGrounding) {
      modelConfig.tools = [{
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: DynamicRetrievalMode.MODE_DYNAMIC,
            dynamicThreshold: 0.7, // Only use grounding when confidence is below 0.7
          }
        }
      }];
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
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = result.response;
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
