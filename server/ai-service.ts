import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { ChatCompletionMessageParam, ChatCompletionContentPartText } from "openai/resources/chat/completions";

const generativeAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Shared constants
const defaultAnalysis = {
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

const defaultLearningPath = {
  next_topics: [
    {
      topic: "Bitcoin Fundamentals",
      description: "Learn the basics of Bitcoin and blockchain technology",
      prerequisites: [],
      practical_exercises: ["Create a wallet", "Send a test transaction"]
    },
    {
      topic: "Wallet Security",
      description: "Understanding how to secure your Bitcoin",
      prerequisites: ["Bitcoin Fundamentals"],
      practical_exercises: ["Setup backup procedures", "Practice recovery"]
    }
  ],
  recommended_resources: [
    "Bitcoin.org documentation",
    "Mastering Bitcoin book"
  ],
  estimated_completion_time: "2-3 weeks"
};

// Test function to verify Gemini API connection
export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const model = generativeAI.getGenerativeModel({ model: "gemini-pro" });
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const prompt = "Write a one-sentence description of Bitcoin.";
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      },
      safetySettings,
    });

    const response = await result.response;
    const text = response.text();

    if (!text || text.length < 10) {
      throw new Error("Received empty or invalid response from Gemini");
    }

    return {
      success: true,
      message: text,
    };
  } catch (error) {
    console.error("Gemini API test error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

function getFallbackTutorResponse(messages: ChatCompletionMessageParam[]): string {
  const lastMessage = messages[messages.length - 1];
  const lastMessageContent = typeof lastMessage?.content === 'string' 
    ? lastMessage.content 
    : Array.isArray(lastMessage?.content) 
      ? (lastMessage.content as ChatCompletionContentPartText[]).map(part => part.text).join(' ')
      : '';

  const normalizedQuestion = lastMessageContent.toLowerCase().trim();

  const fallbackResponses: Record<string, string> = {
    "what is bitcoin?": `Bitcoin is a decentralized digital currency that operates without the need for intermediaries like banks. Key points:

1. Digital Currency: It exists purely in digital form
2. Decentralized: No central authority controls it
3. Secure: Uses advanced cryptography
4. Transparent: All transactions are public
5. Limited Supply: Only 21 million bitcoins will ever exist

Would you like to learn more about any of these aspects?`,
    "default": `I apologize, but I'm currently experiencing some technical difficulties with the AI service. 
Let me provide you with some general guidance about Bitcoin:

1. For beginners, I recommend starting with:
   - What Bitcoin is and how it works
   - Setting up a wallet safely
   - Basic transaction concepts

2. For intermediate users:
   - UTXO management
   - Advanced security practices
   - Transaction fee optimization

Please try your question again in a few moments when the service is restored.

Your question was: "${lastMessageContent}"`
  };

  for (const [key, value] of Object.entries(fallbackResponses)) {
    if (normalizedQuestion.includes(key.toLowerCase())) {
      return value;
    }
  }

  return fallbackResponses.default;
}

export async function getTutorResponse(messages: ChatCompletionMessageParam[], subject: string) {
  try {
    const model = generativeAI.getGenerativeModel({ model: "gemini-pro" });

    const lastMessage = messages[messages.length - 1];
    const messageContent = typeof lastMessage?.content === 'string' 
      ? lastMessage.content 
      : Array.isArray(lastMessage?.content)
        ? (lastMessage.content as ChatCompletionContentPartText[]).map(part => part.text).join(' ')
        : '';

    const prompt = `As a Bitcoin tutor, please respond to this question: ${messageContent}
    Previous context: ${messages.slice(0, -1).map(m => m.content).join('\n')}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return getFallbackTutorResponse(messages);
  }
}

export async function analyzeProgress(chatHistory: ChatCompletionMessageParam[]) {
  try {
    const model = generativeAI.getGenerativeModel({ model: "gemini-pro" });

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
}

Conversation history: ${JSON.stringify(chatHistory.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : 'Complex content'
    })))}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    });

    const response = await result.response;
    const text = response.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      return defaultAnalysis;
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    return defaultAnalysis;
  }
}

export async function generateLearningPath(
  currentLevel: string,
  context: {
    userPreferences: {
      experience: string;
      goal: string;
      time: string;
      style: string;
    };
    currentProgress: any;
  }
) {
  try {
    const model = generativeAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Create a personalized Bitcoin learning path based on the user's preferences:
1. User's experience level: ${context.userPreferences.experience}
2. Learning goal: ${context.userPreferences.goal}
3. Available time: ${context.userPreferences.time}
4. Learning style: ${context.userPreferences.style}

Provide response in this exact JSON format:
{
  "next_topics": [
    {
      "topic": "Topic Name",
      "description": "Topic description",
      "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
      "practical_exercises": ["Exercise 1", "Exercise 2"]
    }
  ],
  "recommended_resources": ["Resource 1", "Resource 2"],
  "estimated_completion_time": "X weeks"
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    });

    const response = await result.response;
    const text = response.text();

    try {
      const path = JSON.parse(text);
      // Ensure mandatory topics
      const mandatoryTopics = ["Bitcoin Basics", "Wallet Security"];
      if (!path.next_topics) {
        path.next_topics = [];
      }
      const existingTopics = path.next_topics.map((topic: any) => topic.topic);
      mandatoryTopics.forEach(topic => {
        if (!existingTopics.includes(topic)) {
          path.next_topics.push({
            topic,
            description: "",
            prerequisites: [],
            practical_exercises: []
          });
        }
      });
      return path;
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      return defaultLearningPath;
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    return defaultLearningPath;
  }
}

export async function generatePracticalExercise(topic: string, difficulty: string) {
  try {
    const model = generativeAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Create a practical Bitcoin exercise for "${topic}" at ${difficulty} difficulty level. 
Include exercise description, hints, solution, and learning objectives. Provide response in JSON format.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    });

    const response = await result.response;
    const text = response.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      return {
        exercise: "Create a basic Bitcoin wallet and explain the importance of backing up your seed phrase.",
        hints: [
          "Think about what makes a wallet secure",
          "Consider the consequences of losing access",
          "Research different backup methods"
        ],
        solution: "1. Choose a reputable wallet\n2. Follow setup instructions\n3. Securely store seed phrase\n4. Test recovery process",
        learning_objectives: [
          "Understanding wallet security",
          "Importance of seed phrases",
          "Backup procedures"
        ]
      };
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      exercise: "Create a basic Bitcoin wallet and explain the importance of backing up your seed phrase.",
      hints: [
        "Think about what makes a wallet secure",
        "Consider the consequences of losing access",
        "Research different backup methods"
      ],
      solution: "1. Choose a reputable wallet\n2. Follow setup instructions\n3. Securely store seed phrase\n4. Test recovery process",
      learning_objectives: [
        "Understanding wallet security",
        "Importance of seed phrases",
        "Backup procedures"
      ]
    };
  }
}