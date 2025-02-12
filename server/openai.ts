import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getTutorResponse(messages: { role: string; content: string }[], subject: string) {
  try {
    const systemPrompt = `You are an expert Bitcoin tutor with deep knowledge of cryptocurrency, blockchain technology, and Bitcoin specifically. Your goal is to:

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

3. Focus on security and best practices:
   - Emphasize importance of private key management
   - Explain common security pitfalls and how to avoid them
   - Teach proper backup procedures
   - Cover safe transaction practices

4. Provide practical guidance:
   - Include step-by-step instructions for common tasks
   - Explain fee estimation and transaction priority
   - Guide through wallet setup and management
   - Demonstrate how to verify transactions

Remember to:
- Use clear, non-technical language for beginners
- Provide more technical details when user shows advanced understanding
- Include specific Bitcoin examples in explanations
- Verify understanding before moving to more complex topics`;

    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 1000, // Increased for more detailed responses
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get tutor response");
  }
}

export async function analyzeProgress(chatHistory: { role: string; content: string }[]): Promise<{
  understanding: number;
  engagement: number;
  areas_for_improvement: string[];
  recommended_topics: string[];
  confidence_by_topic: Record<string, number>;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze the Bitcoin learning interaction and provide detailed feedback in JSON format. Consider:
1. Overall understanding of Bitcoin concepts
2. Engagement with the material
3. Areas needing improvement
4. Recommended next topics
5. Confidence levels in different aspects (basics, security, transactions, etc.)`
        },
        {
          role: "user",
          content: JSON.stringify(chatHistory)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze progress");
  }
}

export async function generateLearningPath(currentLevel: string, progress: any): Promise<{
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Create a personalized Bitcoin learning path based on the user's current level and progress. Include:
1. Next recommended topics
2. Prerequisites for each topic
3. Practical exercises
4. Additional learning resources
5. Estimated time to complete each section`
        },
        {
          role: "user",
          content: JSON.stringify({ currentLevel, progress })
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate learning path");
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

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate exercise");
  }
}