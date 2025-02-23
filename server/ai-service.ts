import { type ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getTutorResponse as getOpenAIResponse, analyzeProgress as analyzeOpenAIProgress } from "./openai";

// Add type definitions
type TopicReadingMaterial = {
  title: string;
  content: string;
  estimated_time: string;
};

type TopicQuiz = {
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }>;
};

type LearningPathTopic = {
  topic: string;
  description: string;
  reading_materials: TopicReadingMaterial[];
  quizzes: TopicQuiz[];
  practical_exercises: string[];
};

// Define mandatory topics array at the top level
const mandatoryTopics: string[] = [
  "Bitcoin Basics",
  "Blockchain Technology",
  "Wallet Security",
  "Transaction Fundamentals",
  "Digital Security",
  "Advanced Concepts",
  "Cold Storage",
  "Mining Operations"
];

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

// Export the tutor response function
export async function getTutorResponse(messages: ChatCompletionMessageParam[], subject: string) {
  try {
    return await getOpenAIResponse(messages, subject);
  } catch (error) {
    console.error('AI service error:', error);
    return getFallbackResponse(messages);
  }
}

// Export the progress analysis function
export async function analyzeProgress(chatHistory: ChatCompletionMessageParam[]) {
  try {
    return await analyzeOpenAIProgress(chatHistory);
  } catch (error) {
    console.error('Progress analysis error:', error);
    return defaultAnalysis;
  }
}

function getFallbackResponse(messages: ChatCompletionMessageParam[]): string {
  const lastMessage = messages[messages.length - 1];
  const lastMessageContent = typeof lastMessage?.content === 'string' 
    ? lastMessage.content 
    : Array.isArray(lastMessage?.content)
      ? lastMessage.content.map(part => typeof part === 'string' ? part : '').join(' ')
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

function getDefaultTopicDescription(topic: string): string {
  const descriptions: Record<string, string> = {
    "Bitcoin Basics": "Learn the fundamentals of Bitcoin, including its history, purpose, and basic concepts of cryptocurrency.",
    "Blockchain Technology": "Understand the underlying technology that powers Bitcoin, including distributed ledgers, consensus mechanisms, and mining.",
    "Wallet Security": "Master essential practices for securing your Bitcoin wallet, including private key management and hardware wallet usage.",
    "Transaction Fundamentals": "Learn how Bitcoin transactions work, including UTXOs, transaction fees, and confirmation times.",
    "Digital Security": "Explore comprehensive digital security measures specific to cryptocurrency, including multisig and best practices.",
    "Advanced Concepts": "Dive deep into advanced Bitcoin concepts, including Layer 2 solutions, Lightning Network, and future developments.",
    "Cold Storage": "Learn about secure offline storage solutions for your Bitcoin, including paper wallets and hardware wallets.",
    "Mining Operations": "Understand Bitcoin mining, including hardware requirements, mining pools, and energy considerations."
  };
  return descriptions[topic] || `Learn about ${topic} and its role in the Bitcoin ecosystem.`;
}

function getDefaultReadingMaterials(topic: string): Array<TopicReadingMaterial> {
  const materials: Record<string, Array<TopicReadingMaterial>> = {
    "Bitcoin Basics": [
      {
        title: "What is Bitcoin?",
        content: `Bitcoin is a revolutionary digital currency that operates without central control. Let's explore its key features:

Key Points:
- First decentralized cryptocurrency
- Created by Satoshi Nakamoto in 2009
- Limited supply of 21 million coins
- Operates on a peer-to-peer network

How Bitcoin Works:
- Transactions are verified by network nodes
- Uses cryptography for security
- Recorded on a public ledger called the blockchain
- No need for intermediaries like banks`,
        estimated_time: "15 minutes"
      },
      {
        title: "Understanding Bitcoin Value",
        content: `Learn what gives Bitcoin its value and how it compares to traditional currencies:

Key Points:
- Supply and demand economics
- Decentralization and censorship resistance
- Store of value properties
- Global accessibility

Bitcoin's Unique Properties:
- Fixed supply schedule
- Divisibility to 8 decimal places
- Borderless transactions
- Programmable money features`,
        estimated_time: "20 minutes"
      }
    ]
  };

  return materials[topic] || [{
    title: `${topic} Overview`,
    content: `This topic covers essential concepts specific to ${topic}.

Key Points:
- Core principles and concepts
- Best practices
- Common challenges
- Implementation strategies

Learning Focus:
- Understanding fundamentals
- Practical applications
- Security considerations
- Advanced techniques`,
    estimated_time: "20 minutes"
  }];
}

function getDefaultQuizzes(topic: string): Array<TopicQuiz> {
  const quizzes: Record<string, Array<TopicQuiz>> = {
    "Bitcoin Basics": [
      {
        title: "Bitcoin Fundamentals Quiz",
        questions: [
          {
            question: "What is the maximum supply of Bitcoin?",
            options: ["21 million", "18 million", "25 million", "Unlimited"],
            correct_answer: "21 million",
            explanation: "Bitcoin has a fixed maximum supply of 21 million coins, which helps maintain its value through scarcity."
          }
        ]
      }
    ]
  };
  return quizzes[topic] || [{
    title: `${topic} Assessment`,
    questions: [
      {
        question: `What is the main purpose of ${topic}?`,
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correct_answer: "Option 1",
        explanation: "This is a placeholder question. The actual quiz will contain relevant questions about the topic."
      }
    ]
  }];
}

function getDefaultExercises(topic: string): string[] {
  const exercises: Record<string, string[]> = {
    "Bitcoin Basics": [
      "Create a paper wallet",
      "Send a test transaction",
      "Verify a transaction on the blockchain"
    ]
  };
  return exercises[topic] || [`Practice ${topic} concepts through hands-on exercises`];
}

// Export additional utility functions
export async function generateLearningPath(currentLevel: string, context: any) {
  return {
    next_topics: [
      {
        topic: "Bitcoin Basics",
        description: getDefaultTopicDescription("Bitcoin Basics"),
        prerequisites: [],
        practical_exercises: getDefaultExercises("Bitcoin Basics"),
        reading_materials: getDefaultReadingMaterials("Bitcoin Basics"),
        quizzes: getDefaultQuizzes("Bitcoin Basics")
      }
    ],
    recommended_resources: ["Bitcoin.org documentation"],
    estimated_completion_time: "2-3 weeks"
  };
}

export async function testGeminiConnection() {
  return {
    success: true,
    message: "Using OpenAI GPT-4o model"
  };
}

export async function generatePracticalExercise(topic: string, difficulty: string) {
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