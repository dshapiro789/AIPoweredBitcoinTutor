import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatCompletionMessageParam, ChatCompletionContentPart } from "openai/resources/chat/completions";

const generativeAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function getFallbackTutorResponse(messages: ChatCompletionMessageParam[]): string {
  const lastMessage = messages[messages.length - 1];
  const lastMessageContent = typeof lastMessage?.content === 'string' 
    ? lastMessage.content 
    : Array.isArray(lastMessage?.content) 
      ? lastMessage.content.map(part => 
          typeof part === 'string' ? part : 'text' in part ? part.text : ''
        ).join(' ')
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

    // Convert OpenAI message format to Gemini format
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [typeof msg.content === 'string' 
        ? msg.content 
        : Array.isArray(msg.content) 
          ? msg.content.map(part => 
              typeof part === 'string' ? part : 'text' in part ? part.text : ''
            ).join(' ') 
          : '']
    }));

    const chat = model.startChat({
      history: formattedMessages.slice(0, -1),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(formattedMessages[formattedMessages.length - 1].parts[0]);
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

    const prompt = `Analyze the Bitcoin learning interaction and provide detailed feedback in JSON format. Consider:
1. Overall understanding of Bitcoin concepts
2. Engagement with the material
3. Areas needing improvement
4. Recommended next topics
5. Confidence levels in different aspects (basics, security, transactions, etc.)

Chat history for analysis: ${JSON.stringify(chatHistory)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    try {
      return JSON.parse(response.text());
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

Provide response in JSON format including next_topics (array of topics with descriptions and prerequisites), 
recommended_resources (array of strings), and estimated_completion_time (string).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    try {
      const path = JSON.parse(response.text());
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    try {
      return JSON.parse(response.text());
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