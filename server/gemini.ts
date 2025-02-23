import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Convert OpenAI message format to Gemini format
function convertToGeminiHistory(messages: ChatCompletionMessageParam[]): string {
  return messages
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n');
}

export async function getTutorResponse(messages: ChatCompletionMessageParam[], subject: string) {
  try {
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: "You are a Bitcoin expert tutor. Please provide clear, accurate responses about Bitcoin and cryptocurrency.",
        },
        {
          role: "model",
          parts: "I understand. I'll act as a Bitcoin expert tutor, providing accurate and educational responses about Bitcoin and cryptocurrency. How can I help you learn today?",
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(convertToGeminiHistory(messages));
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

export async function analyzeProgress(chatHistory: ChatCompletionMessageParam[]) {
  try {
    const prompt = `
      Analyze this Bitcoin learning chat history and provide feedback in JSON format:
      ${convertToGeminiHistory(chatHistory)}
      
      Provide analysis in this format:
      {
        "understanding": number between 0-1,
        "engagement": number between 0-1,
        "areas_for_improvement": string array,
        "recommended_topics": string array,
        "confidence_by_topic": object with topic names as keys and confidence scores as values
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    try {
      return JSON.parse(response.text());
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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Test connection");
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
