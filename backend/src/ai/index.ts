import { ADD_SUGGESTED_TITLE, SYSTEM_PROMPT } from "./constants";
import OpenAI from "openai";
import "dotenv/config";
import createInstructor from "@instructor-ai/instructor";
import z from "zod";

const oai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const client = createInstructor({
  client: oai,
  mode: "FUNCTIONS",
});

const ResponseSchema = z.object({
  output_text: z.string(),
  related_queries: z.array(z.string()),
  suggested_title: z.string(),
});

export const customerSupportChat = async (
  generateTitle: boolean,
  userMessage: string,
) => {
  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: !generateTitle ? SYSTEM_PROMPT : `${SYSTEM_PROMPT}\n\n${ADD_SUGGESTED_TITLE}`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 1,
      top_p: 1,
      max_completion_tokens: 8192,
      reasoning_effort: "medium",
      stop: null,
      response_model: {
        schema: ResponseSchema,
        name: "CustomerSupportResponse",
      },
    });

    return response;
  } catch (error) {
    console.error("Error occurred while fetching customer support chat response:", error);
    throw error;
  }
};
