import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";
import { Tool } from "@anthropic-ai/sdk/resources/messages.mjs";

const anthropic = new Anthropic();

// Define tools for the assistant to use
const toolDefinitions: Tool[] = [
  {
    name: 'save_note',
    description: 'Save a note to the database for future reference',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          description: 'The content of the note. Should be a standalone, succinct piece of information that will make sense to the user.',
          type: 'string',
        },
        context: {
          description: 'The conversational context of the note, including why this note is being saved',
          type: 'string',
        },
      },
      required: ['content', 'context'],
    },
  },
  {
    name: 'search_notes',
    description: 'Search for notes to answer personal questions',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          description: 'The search query to use to find notes',
          type: 'string',
        },
      },
      required: ['query'],
    },
  }
]

async function main() {

  const userMessage = 'Can you search my notes for blog writing tips?';

  console.log('User:', userMessage);

  const claudeResponse = await anthropic.messages.create({
    messages: [{ role: 'user', content: userMessage }],
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    // Pass the tool definitions to the assistant
    tools: toolDefinitions
  });

  console.log("Full API response:");
  console.log(JSON.stringify(claudeResponse, null, 2))
}

main();

