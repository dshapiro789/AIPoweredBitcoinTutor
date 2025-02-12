import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getTutorResponse(messages: { role: string; content: string }[], subject: string) {
  try {
    const systemPrompt = `You are an expert tutor in ${subject} with years of teaching experience. Your goal is to:
1. Adapt your teaching style based on the student's responses and engagement level
2. Break down complex concepts into manageable parts
3. Use the Socratic method to guide students toward understanding
4. Provide relevant examples and analogies
5. Offer gentle correction and positive reinforcement
6. Maintain a warm and encouraging tone

Additional guidelines:
- If a student seems confused, break down the explanation further
- If a student shows understanding, introduce more advanced concepts
- Use interactive examples where appropriate
- Encourage critical thinking through targeted questions
- Provide real-world applications of concepts`;

    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 800, // Increased for more detailed responses
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
  learning_style: string;
  recommended_approach: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analyze the learning interaction and provide detailed feedback in JSON format. Consider: comprehension level, engagement, learning style, and specific areas needing attention."
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

export async function generateLearningPath(subject: string, currentLevel: string): Promise<{
  milestones: Array<{ topic: string; description: string }>;
  estimated_duration: string;
  prerequisites: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Create a personalized learning path for ${subject} at ${currentLevel} level. Include key milestones, time estimates, and prerequisites.`
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