import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Initialize OpenRouter with OpenAI-compatible client
const openRouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  headers: {
    "HTTP-Referer": process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.dev` : "http://localhost:3000",
    "X-Title": "Bitcoin Learning Platform"
  }
});

// Test connectivity to OpenRouter API
export async function testOpenRouterConnection(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Starting OpenRouter connection test with config:', {
      baseURL: "https://openrouter.ai/api/v1",
      hasApiKey: !!process.env.OPENROUTER_API_KEY,
      apiKeyLength: process.env.OPENROUTER_API_KEY?.length,
      replSlug: process.env.REPL_SLUG,
      referer: process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.dev` : "http://localhost:3000"
    });

    const startTime = Date.now();
    const response = await openRouter.chat.completions.create({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [{ role: "user", content: "Simple test message" }],
      max_tokens: 5,
      temperature: 0.7
    });
    const endTime = Date.now();

    console.log('OpenRouter test succeeded:', {
      duration: `${endTime - startTime}ms`,
      choices: response.choices?.length,
      firstMessageContent: response.choices[0]?.message?.content,
      usage: response.usage,
      id: response.id
    });

    return { 
      success: true, 
      message: "Successfully connected to OpenRouter API"
    };
  } catch (error: any) {
    console.error('OpenRouter connection test failed:', {
      type: error?.constructor?.name,
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      stack: error?.stack,
      // Additional diagnostics
      env: {
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        replSlug: process.env.REPL_SLUG,
        nodeEnv: process.env.NODE_ENV
      }
    });

    if (!process.env.OPENROUTER_API_KEY) {
      return { 
        success: false, 
        message: "OpenRouter API key is missing" 
      };
    }
    if (error?.response?.status === 401) {
      return { 
        success: false, 
        message: "Invalid OpenRouter API key or authentication failed" 
      };
    }
    if (error?.response?.status === 429) {
      return { 
        success: false, 
        message: "Rate limit exceeded - please try again in a few minutes" 
      };
    }
    if (error?.message?.includes('ECONNREFUSED')) {
      return {
        success: false,
        message: "Could not connect to OpenRouter API - possible network issue"
      };
    }

    return { 
      success: false, 
      message: `Connection failed: ${error?.message || 'Unknown error'}` 
    };
  }
}

// Get chat response with enhanced error handling and logging
export async function getChatResponse(messages: ChatCompletionMessageParam[], subject: string) {
  const startTime = Date.now();
  try {
    console.log('Preparing OpenRouter chat request:', {
      hasApiKey: !!process.env.OPENROUTER_API_KEY,
      messageCount: messages.length,
      subject,
      firstMessagePreview: messages[0]?.content?.toString().substring(0, 50)
    });

    const response = await openRouter.chat.completions.create({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [
        {
          role: "system",
          content: `You are an expert Bitcoin tutor. Current subject: ${subject}`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const endTime = Date.now();
    console.log('OpenRouter chat response succeeded:', {
      duration: `${endTime - startTime}ms`,
      choices: response.choices?.length,
      messageContent: response.choices[0]?.message?.content?.substring(0, 50) + '...',
      usage: response.usage,
      id: response.id
    });

    return response.choices[0]?.message?.content || getFallbackResponse();
  } catch (error: any) {
    const endTime = Date.now();
    console.error('OpenRouter chat request failed:', {
      duration: `${endTime - startTime}ms`,
      type: error?.constructor?.name,
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      stack: error?.stack,
      requestConfig: {
        messageCount: messages.length,
        subject,
        model: "mistralai/mistral-7b-instruct:free"
      }
    });
    return getFallbackResponse();
  }
}

function getFallbackResponse(): string {
  return `I apologize, but I'm currently experiencing technical difficulties connecting to the AI service. Let me provide you with some general guidance about Bitcoin:

1. For beginners, I recommend starting with:
   - What Bitcoin is and how it works
   - Setting up a wallet safely
   - Basic transaction concepts

2. For intermediate users:
   - UTXO management
   - Advanced security practices
   - Transaction fee optimization

Please try your question again in a few moments when the service is restored.`;
}

// Learning progress analysis with enhanced error handling and logging
export async function analyzeLearningProgress(messages: ChatCompletionMessageParam[]) {
  const startTime = Date.now();
  try {
    console.log('Starting learning progress analysis:', {
      messageCount: messages.length,
      firstMessagePreview: messages[0]?.content?.toString().substring(0, 50)
    });

    const response = await openRouter.chat.completions.create({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [
        {
          role: "system",
          content: "Analyze this chat history and provide feedback in JSON format"
        },
        {
          role: "user",
          content: JSON.stringify(messages)
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const endTime = Date.now();
    console.log('Learning progress analysis succeeded:', {
      duration: `${endTime - startTime}ms`,
      responseLength: response.choices[0]?.message?.content?.length,
      usage: response.usage
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error: any) {
    const endTime = Date.now();
    console.error('Learning progress analysis failed:', {
      duration: `${endTime - startTime}ms`,
      type: error?.constructor?.name,
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      stack: error?.stack
    });

    // Return default analysis on error
    return {
      understanding: 0.7,
      engagement: 0.8,
      areas_for_improvement: ["Bitcoin Basics", "Security Best Practices"],
      recommended_topics: ["Understanding Bitcoin Wallets", "Transaction Fundamentals"],
      confidence_by_topic: {
        "Bitcoin Basics": 0.6,
        "Wallet Security": 0.5,
        "Transactions": 0.4
      }
    };
  }
}