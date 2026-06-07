import { ADD_SUGGESTED_TITLE, SYSTEM_PROMPT, MAX_QUERY_LENGTH, QUERY_TRUNCATION_WARNING } from "./constants";
import "dotenv/config";
import z from "zod";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ResponseSchema = z.object({
  output_text: z.string(),
  related_queries: z.array(z.string()),
  suggested_title: z.string().optional(),
});

const truncateQuery = (message: string): string => {
  if (message.length > MAX_QUERY_LENGTH) {
    return message.substring(0, MAX_QUERY_LENGTH) + QUERY_TRUNCATION_WARNING;
  }
  return message;
};

export const customerSupportChat = async (
  generateTitle: boolean,
  userMessage: string,
) => {
  try {
    // Truncate query if too long
    const truncatedMessage = truncateQuery(userMessage);

    const rawResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: !generateTitle
            ? SYSTEM_PROMPT
            : `${SYSTEM_PROMPT}\n\n${ADD_SUGGESTED_TITLE}`,
        },
        {
          role: "user",
          content: truncatedMessage,
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 1,
      top_p: 1,
      stop: null,
    });

    // Parse JSON response from model text
    let response: z.infer<typeof ResponseSchema> = { output_text: "", related_queries: [] };
    try {
      const content = rawResponse.choices?.[0]?.message?.content || "";
      // Extract JSON object from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        response = {
          output_text: parsed.output_text || "",
          related_queries: parsed.related_queries,
          suggested_title: parsed.suggested_title,
        };
      } else {
        response = { output_text: content, related_queries: [] };
      }
    } catch (parseError) {
      console.warn("Failed to parse JSON response:", parseError);
      response = { output_text: rawResponse.choices?.[0]?.message?.content || "", related_queries: [] };
    }

    console.log("Parsed response:", response);
    
    return response;
  } catch (error) {
    console.error(
      "Error occurred while fetching customer support chat response:",
      error,
    );
    throw error;
  }
};
