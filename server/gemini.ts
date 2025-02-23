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

export async function getTutorResponse(messages: ChatCompletionMessageParam[], subject: string) {
  try {
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });

    // Add the system message first
    await chat.sendMessage([{
      text: "You are a Bitcoin expert tutor. Please provide clear, accurate responses about Bitcoin and cryptocurrency."
    }]);

    // Send each message in the history
    for (const msg of messages) {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      await chat.sendMessage([{ text: content }]);
    }

    // Get the final response
    const result = await chat.sendMessage([{
      text: messages[messages.length - 1].content?.toString() || ""
    }]);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

export async function analyzeProgress(chatHistory: ChatCompletionMessageParam[]) {
  try {
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

    const result = await model.generateContent([{ text: analysisPrompt }]);
    const response = await result.response;

    try {
      // Extract JSON from the response
      const jsonMatch = response.text().match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response");
        return getDefaultAnalysis();
      }
      return JSON.parse(jsonMatch[0]);
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
    const result = await model.generateContent([{ text: "Test connection" }]);
    const response = await result.response;
    return {
      success: true,
      message: "Successfully connected to Gemini API"
    };
  } catch (error) {
    console.error("Gemini connection test failed:", error);
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