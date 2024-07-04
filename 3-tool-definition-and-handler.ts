import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";
import weaviate from "weaviate-client";
import { Tool } from "@anthropic-ai/sdk/resources/messages.mjs";

const anthropic = new Anthropic();

type ToolHandlerObject = {
  [key: string]: (input: any) => Promise<any>
}

// Define the handler functions for each tool.
// The keys are the tool names.
const toolHandlers: ToolHandlerObject = {
  'save_note': async ({ content, context }: { content: string, context: string }) => {
    // Using Weaviate's v3 TypeScript client library
    const weaviateClient = await weaviate.connectToLocal();
    const notesCollection = weaviateClient.collections.get('Note');

    // Inserting new note into the database
    await notesCollection.data.insert({
      content,
      context,
      createdAt: new Date()
    })

    return true;
  },
  'search_notes': async ({ query }: { query: string }) => {
    const weaviateClient = await weaviate.connectToLocal();
    const notesCollection = weaviateClient.collections.get('Note');

    // Searching for notes similar to the query
    const queryResponse = await notesCollection.query.hybrid(query, {
      limit: 5
    });

    const notes = queryResponse.objects.map(object => {
      return {
        id: object.uuid,
        ...object.properties
      }
    })

    return notes;
  }
}

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

  const claudeResponse = await anthropic.messages.create({
    messages: [{ role: 'user', content: userMessage }],
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    tools: toolDefinitions,
  });

  console.log("Full API response:");
  console.log(JSON.stringify(claudeResponse, null, 2))

  if (claudeResponse.stop_reason === "tool_use") {

    // Loop through the tool_use content blocks
    // There may be more than one if multiple tools are called within one request.
    const toolUseContentBlocks = claudeResponse.content.filter(contentBlock => contentBlock.type === "tool_use");

    for (const toolUseContentBlock of toolUseContentBlocks) {
      const toolName = toolUseContentBlock.name;
      const toolInput = toolUseContentBlock.input;

      console.log({ toolName, toolInput });

      const toolHandler = toolHandlers[toolName];

      if (!toolHandler) {
        throw new Error("No handler found for tool: " + toolName);
      }

      const toolOutput = await toolHandler(toolInput);

      console.log({ toolOutput })
    }
  }
}

main();

