import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Convert OpenAI message format to Gemini format
function convertToGeminiHistory(messages: ChatCompletionMessageParam[]): { role: string, parts: string[] }[] {
  return messages.map(msg => ({
    role: msg.role,
    parts: [typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)]
  }));
}

export async function getTutorResponse(messages: ChatCompletionMessageParam[], subject: string) {
  try {
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: ["You are a Bitcoin expert tutor. Please provide clear, accurate responses about Bitcoin and cryptocurrency."]
        },
        {
          role: "model",
          parts: ["I understand. I'll act as a Bitcoin expert tutor, providing accurate and educational responses about Bitcoin and cryptocurrency. How can I help you learn today?"]
        },
        ...convertToGeminiHistory(messages)
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(
      typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content)
    );
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

export async function analyzeProgress(chatHistory: ChatCompletionMessageParam[]) {
  try {
    const prompt = {
      role: "user",
      parts: [`
        Analyze this Bitcoin learning chat history and provide feedback.
        History: ${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

        Provide analysis with these exact fields:
        - understanding (number 0-1)
        - engagement (number 0-1)
        - areas_for_improvement (array of strings)
        - recommended_topics (array of strings)
        - confidence_by_topic (object with topic scores)
      `]
    };

    const result = await model.generateContent(prompt);
    const response = await result.response;

    try {
      // Clean up the response to ensure valid JSON
      const cleanJson = response.text()
        .replace(/```json\s*/, '')
        .replace(/```\s*$/, '')
        .trim();
      return JSON.parse(cleanJson);
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
    const result = await model.generateContent({
      role: "user",
      parts: ["Test connection"]
    });
    const response = await result.response;

    return {
      success: true,
      message: "Successfully connected to Gemini API"
    };
  } catch (error) {
    console.error("Gemini connection test failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to connect to Gemini API"
    };
  }
}