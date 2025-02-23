import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Initialize Gemini with safety settings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

// Maximum retries for API calls
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryWithDelay<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying operation, ${retries} attempts remaining`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryWithDelay(operation, retries - 1);
    }
    throw error;
  }
}

export async function getTutorResponse(messages: ChatCompletionMessageParam[], subject: string) {
  try {
    console.log('Starting getTutorResponse with:', {
      messageCount: messages.length,
      subject,
      lastMessagePreview: messages[messages.length - 1]?.content?.toString().substring(0, 50)
    });

    const chat = await retryWithDelay(() => model.startChat({
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    }));

    // Add the system message first
    console.log('Sending system message to chat');
    await retryWithDelay(() => chat.sendMessage([{
      text: "You are a Bitcoin expert tutor. Please provide clear, accurate responses about Bitcoin and cryptocurrency."
    }]));

    // Send each message in the history
    for (const msg of messages) {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      console.log('Sending chat message:', {
        role: msg.role,
        contentPreview: content.substring(0, 50)
      });
      await retryWithDelay(() => chat.sendMessage([{ text: content }]));
    }

    // Get the final response
    console.log('Getting final response');
    const result = await retryWithDelay(() => chat.sendMessage([{
      text: messages[messages.length - 1].content?.toString() || ""
    }]));
    const response = await result.response;

    console.log('Got successful response:', {
      responsePreview: response.text().substring(0, 50)
    });

    return response.text();
  } catch (error) {
    console.error("Gemini API error:", {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      context: {
        messageCount: messages.length,
        subject,
        apiKeyExists: !!process.env.GEMINI_API_KEY
      }
    });
    throw error;
  }
}

export async function analyzeProgress(chatHistory: ChatCompletionMessageParam[]) {
  try {
    console.log('Starting progress analysis');
    const analysisPrompt = `
      Analyze this Bitcoin learning chat history and provide feedback.
      History:
      ${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

      Provide the analysis in the following JSON format:
      {
        "understanding": 0.7,
        "engagement": 0.8,
        "areas_for_improvement": ["Topic 1", "Topic 2"],
        "recommended_topics": ["Topic 3", "Topic 4"],
        "confidence_by_topic": {
          "Bitcoin Basics": 0.6,
          "Wallet Security": 0.5
        }
      }
    `;

    const result = await retryWithDelay(() => 
      model.generateContent([{ text: analysisPrompt }])
    );
    const response = await result.response;

    try {
      // Extract JSON from the response
      const jsonMatch = response.text().match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response");
        return getDefaultAnalysis();
      }
      const analysis = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed analysis:', {
        understanding: analysis.understanding,
        engagement: analysis.engagement,
        areasCount: analysis.areas_for_improvement?.length,
        topicsCount: analysis.recommended_topics?.length
      });
      return analysis;
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      return getDefaultAnalysis();
    }
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return getDefaultAnalysis();
  }
}

function getDefaultAnalysis() {
  return {
    understanding: 0.7,
    engagement: 0.8,
    areas_for_improvement: ["Bitcoin Basics", "Security Best Practices"],
    recommended_topics: [
      "Understanding Bitcoin Wallets",
      "Transaction Fundamentals",
      "Security Essentials"
    ],
    confidence_by_topic: {
      "Bitcoin Basics": 0.6,
      "Wallet Security": 0.5,
      "Transactions": 0.4
    }
  };
}

export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Testing Gemini connection with config:', {
      apiKeyExists: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length
    });

    const result = await retryWithDelay(() => 
      model.generateContent([{ text: "Test connection" }])
    );
    const response = await result.response;

    console.log('Gemini test response received:', {
      responseLength: response.text().length
    });

    return {
      success: true,
      message: "Successfully connected to Gemini API"
    };
  } catch (error) {
    console.error("Gemini connection test failed:", {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      context: {
        apiKeyExists: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length
      }
    });

    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        message: "Gemini API key is missing"
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to connect to Gemini API"
    };
  }
}