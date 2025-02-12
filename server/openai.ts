import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getTutorResponse(messages: { role: string; content: string }[], subject: string) {
  try {
    const systemPrompt = `You are a knowledgeable and patient tutor specialized in ${subject}. 
    Provide clear, engaging explanations and guide the student through concepts step by step.
    Keep responses concise but thorough, and encourage critical thinking.`;

    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get tutor response");
  }
}

export async function analyzeProgress(chatHistory: { role: string; content: string }[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analyze the chat history and provide a progress assessment in JSON format with fields: understanding (1-5), engagement (1-5), areas_for_improvement (string[])"
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
