/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {GoogleGenAI} from '@google/genai';

// This check is for development-time feedback.
if (!process.env.API_KEY) {
  console.error(
    'API_KEY environment variable is not set. The application will not be able to connect to the Gemini API.',
  );
}

// The "!" asserts API_KEY is non-null after the check.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

// We need gemini-2.5-flash (not lite) to support the googleSearch tool reliably.
const textModelName = 'gemini-2.5-flash';

export interface AsciiArtData {
  art: string;
  text?: string;
}

/**
 * Streams a definition for a given topic from the Gemini API.
 * @param topic The word or term to define.
 * @param language The language to generate the content in.
 * @returns An async generator that yields text chunks of the definition.
 */
export async function* streamDefinition(
  topic: string,
  language: string = 'English'
): AsyncGenerator<string, void, undefined> {
  if (!process.env.API_KEY) {
    yield 'Error: API_KEY is not configured. Please check your environment variables to continue.';
    return;
  }

  const prompt = `
      You are an intelligent encyclopedia assistant. Your task is to provide a structured wiki-style entry for the term "${topic}" in the language specified (${language}).

      Your response must strictly follow this exact format:

      ## Description
      [A concise, single-paragraph encyclopedia-style definition for "${topic}". The tone must be informative and neutral.]

      ## Related Topic
      [You MUST use the google_search tool to find "people also search for," "related topics," or "associated concepts" for "${topic}". Based on the search results, provide a list of 3-5 relevant items, entities, or related concepts. The list must be formatted strictly as a numbered list. Do not add any introductory text before the list. Just provide the list.]

      The required format for the list items is:
      1. **Item Name** - A brief explanation of why it is related or what it is.
      2. **Item Name** - A brief explanation.
      [... up to 5 items]

      Do not use any markdown headers other than '## Description' and '## Related Topic'. Ensure the entire response is clean and directly follows the required structure.
  `;

  try {
    const response = await ai.models.generateContentStream({
      model: textModelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error('Error streaming from Gemini:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    yield `Error: Could not generate content for "${topic}". ${errorMessage}`;
    // Re-throwing allows the caller to handle the error state definitively.
    throw new Error(errorMessage);
  }
}