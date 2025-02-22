import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Initialize OpenRouter with OpenAI-compatible client
const openRouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultQuery: { temperature: 0.7 },
  defaultHeaders: {
    "HTTP-Referer": process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.dev` : "http://localhost:3000",
    "X-Title": "Bitcoin Learning Platform"
  },
});

// Default response in case of API errors
const defaultResponse = `I apologize, but I'm currently experiencing some technical difficulties. 
Let me provide you with some general guidance about Bitcoin:

1. For beginners, I recommend starting with:
   - What Bitcoin is and how it works
   - Setting up a wallet safely
   - Basic transaction concepts

2. For intermediate users:
   - UTXO management
   - Advanced security practices
   - Transaction fee optimization

Please try your question again in a few moments when the service is restored.`;

export async function getChatResponse(messages: ChatCompletionMessageParam[], subject: string) {
  const systemPrompt = {
    role: "system",
    content: `You are an expert Bitcoin tutor. Current subject: ${subject}`
  };

  try {
    // Log request details
    console.log('OpenRouter Request:', {
      model: 'deepseek-r1:free',
      temperature: 0.7,
      max_tokens: 1000,
      messageCount: messages.length + 1,
      systemPrompt: systemPrompt.content
    });

    const response = await openRouter.chat.completions.create({
      model: "deepseek-r1:free",
      messages: [systemPrompt, ...messages],
      stream: false,
      temperature: 0.7,
      max_tokens: 1000
    });

    // Log response details
    console.log('OpenRouter Response:', {
      status: 'success',
      choices: response.choices?.length,
      firstMessagePreview: response.choices[0]?.message?.content?.substring(0, 100)
    });

    return response.choices[0]?.message?.content || defaultResponse;
  } catch (error: any) {
    // Detailed error logging
    console.error('OpenRouter Error:', {
      type: error?.constructor?.name,
      message: error?.message,
      status: error?.status,
      response: {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        headers: error?.response?.headers
      }
    });
    return defaultResponse;
  }
}

export async function analyzeLearningProgress(messages: ChatCompletionMessageParam[]) {
  try {
    console.log('Sending analysis request to OpenRouter...');

    const response = await openRouter.chat.completions.create({
      model: "deepseek-r1:free",
      messages: [
        {
          role: "system",
          content: `Analyze this chat history and provide feedback in JSON format`
        },
        {
          role: "user",
          content: JSON.stringify(messages)
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error: any) {
    console.error('OpenRouter Analysis Error:', {
      type: error?.constructor?.name,
      message: error?.message,
      status: error?.status,
      response: error?.response?.data
    });

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