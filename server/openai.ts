import OpenAI from "openai";
import { type ChatCompletionMessageParam } from "openai/resources/chat/completions";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Test OpenAI API connection
export async function testOpenAIConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Test connection" }],
      max_tokens: 5
    });

    return {
      success: true,
      message: "Successfully connected to OpenAI API"
    };
  } catch (error: any) {
    console.error("OpenAI connection test failed:", {
      error: error?.message,
      type: error?.type,
      status: error?.status
    });

    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        message: "OpenAI API key is missing"
      };
    }

    return {
      success: false,
      message: `Failed to connect to OpenAI: ${error?.message || 'Unknown error'}`
    };
  }
}

export async function getTutorResponse(messages: ChatCompletionMessageParam[], subject: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert Bitcoin tutor. Your goal is to provide accurate, concise information about ${subject}. Focus on practical understanding and real-world applications.`
        },
        ...messages.slice(-3) // Only use last 3 messages for context to improve response time
      ],
      temperature: 0.7,
      max_tokens: 500, // Reduced for faster responses
    });

    return response.choices[0].message.content || getFallbackTutorResponse(messages);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return getFallbackTutorResponse(messages);
  }
}

export async function analyzeProgress(chatHistory: ChatCompletionMessageParam[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analyze this chat history and provide feedback in JSON format"
        },
        {
          role: "user",
          content: JSON.stringify(chatHistory.slice(-5)) // Only analyze recent messages
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("OpenAI API error:", error);
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

function getFallbackTutorResponse(messages: ChatCompletionMessageParam[]): string {
  const lastMessage = messages[messages.length - 1];
  const lastMessageContent = typeof lastMessage?.content === 'string' 
    ? lastMessage.content 
    : Array.isArray(lastMessage?.content) 
      ? (lastMessage.content as any[]).map(part => part.text).join(' ')
      : '';

  return `I apologize for the delay. Let me provide a response about Bitcoin: ${lastMessageContent}

Key Bitcoin topics to explore:
1. Fundamentals and how it works
2. Wallet security and best practices
3. Transaction basics and fees
4. Advanced concepts and future developments

Please try your question again in a moment when the service is fully responsive.`;
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
): Promise<{
  next_topics: Array<{
    topic: string;
    description: string;
    prerequisites: string[];
    practical_exercises: string[];
  }>;
  recommended_resources: string[];
  estimated_completion_time: string;
}> {
  try {
    // Ensure we have valid user preferences
    if (!context?.userPreferences?.experience) {
      console.log("Missing user preferences, using default path");
      return defaultLearningPath;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Create a personalized Bitcoin learning path based on the user's preferences and current progress. Consider:
1. User's experience level: ${context.userPreferences.experience}
2. Learning goal: ${context.userPreferences.goal}
3. Available time: ${context.userPreferences.time}
4. Learning style: ${context.userPreferences.style}

Tailor the path to match these preferences while maintaining a logical progression through Bitcoin concepts.`
        },
        {
          role: "user",
          content: JSON.stringify({
            currentLevel,
            context
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    const path = JSON.parse(response.choices[0].message.content || '{}');

    // Ensure the path includes mandatory topics regardless of preferences
    const mandatoryTopics = ["Bitcoin Basics", "Wallet Security"];
    if (!path.next_topics) {
      path.next_topics = [];
    }
    const existingTopics = path.next_topics.map((topic: any) => topic.topic);
    mandatoryTopics.forEach(topic => {
      if (!existingTopics.includes(topic)) {
        path.next_topics.push({ topic, description: "", prerequisites: [], practical_exercises: [] });
      }
    });

    return path;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return defaultLearningPath;
  }
}

export async function generatePracticalExercise(topic: string, difficulty: string): Promise<{
  exercise: string;
  hints: string[];
  solution: string;
  learning_objectives: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Create a practical Bitcoin exercise for the given topic and difficulty level. Include:
1. Clear exercise description
2. Progressive hints
3. Detailed solution
4. Specific learning objectives`
        },
        {
          role: "user",
          content: JSON.stringify({ topic, difficulty })
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("OpenAI API error:", error);
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