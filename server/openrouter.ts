import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Initialize OpenRouter with OpenAI-compatible client
const openRouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.dev` : "http://localhost:3000",
    "X-Title": "Bitcoin Learning Platform",
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
  try {
    const systemPrompt: ChatCompletionMessageParam = {
      role: "system",
      content: `You are an expert Bitcoin tutor with deep knowledge of cryptocurrency, blockchain technology, and Bitcoin specifically. Your goal is to:

1. Teach Bitcoin concepts with real-world applications:
   - Explain how Bitcoin transactions work with practical examples
   - Guide through wallet security best practices
   - Demonstrate UTXO management with real scenarios
   - Explain concepts using analogies from traditional finance when helpful

2. Adapt teaching style based on user understanding:
   - Start with fundamentals for beginners
   - Progress to more complex topics as understanding grows
   - Use the Socratic method to guide learning
   - Provide hands-on exercises when appropriate

Current subject: ${subject}`
    };

    console.log('Preparing OpenRouter request with model: deepseek-r1:free');
    console.log('Request messages:', JSON.stringify({ 
      systemPrompt, 
      messages: messages.map(m => ({ role: m.role, contentLength: m.content?.length }))
    }, null, 2));

    const response = await openRouter.chat.completions.create({
      model: "deepseek-r1:free",
      messages: [systemPrompt, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    });

    console.log('OpenRouter response received:', {
      status: 'success',
      choices: response.choices?.length,
      firstChoice: response.choices[0]?.message?.content?.substring(0, 100) + '...'
    });

    return response.choices[0].message.content || defaultResponse;
  } catch (error) {
    console.error("OpenRouter API error details:", {
      name: (error as Error).name,
      message: (error as Error).message,
      status: (error as any).status,
      response: (error as any).response?.data,
    });
    return defaultResponse;
  }
}

export async function analyzeLearningProgress(messages: ChatCompletionMessageParam[]) {
  try {
    const prompt = `Analyze this Bitcoin learning conversation and provide structured feedback in this exact JSON format:
{
  "understanding": 0.7,
  "engagement": 0.8,
  "areas_for_improvement": ["Topic 1", "Topic 2"],
  "recommended_topics": ["Topic 1", "Topic 2", "Topic 3"],
  "confidence_by_topic": {
    "Bitcoin Basics": 0.6,
    "Wallet Security": 0.5,
    "Transactions": 0.4
  }
}`;

    console.log('Sending analysis request to OpenRouter...');
    const response = await openRouter.chat.completions.create({
      model: "deepseek-r1:free",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(messages) }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    console.log('OpenRouter analysis response received');
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("OpenRouter API error details:", {
      name: (error as Error).name,
      message: (error as Error).message,
      status: (error as any).status,
      response: (error as any).response?.data,
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