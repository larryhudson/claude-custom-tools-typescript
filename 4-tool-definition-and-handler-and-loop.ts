import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";
import weaviate from "weaviate-client";
import { Tool, MessageParam, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages.mjs";

const anthropic = new Anthropic();

type ToolHandlerObject = {
  [key: string]: (input: any) => Promise<any>
}

const toolHandlers: ToolHandlerObject = {
  'save_note': async ({ content, context }: { content: string, context: string }) => {
    const weaviateClient = await weaviate.connectToLocal();
    const notesCollection = weaviateClient.collections.get('Note');

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
  const initialMessages: MessageParam[] = [{ role: 'user', content: userMessage }];

  // Keep track of new messages so we can include them if we need to ask the assistant for another message
  // (e.g. if the assistant asks to use a tool, we can reply with the tool result)
  const newMessages: MessageParam[] = [];

  // In a do-while loop, it will run once before checking the condition at the end of the loop.
  // The loop will only repeat if stopReason === 'tool_use'
  let stopReason;
  do {
    const claudeResponse = await anthropic.messages.create({
      // Combine the initial messages and any new messages we have generated
      messages: [...initialMessages, ...newMessages],
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      tools: toolDefinitions,
    });

    console.log('Full API response:');
    console.log(JSON.stringify(claudeResponse, null, 2))

    const assistantMessage: MessageParam = {
      role: 'assistant',
      content: claudeResponse.content
    }

    // Add the assistant message to the new messages, for the next loop iteration
    newMessages.push(assistantMessage);

    stopReason = claudeResponse.stop_reason;
    if (stopReason === "tool_use") {
      const toolUseContentBlocks = claudeResponse.content.filter(contentBlock => contentBlock.type === "tool_use");

      // Build up an array of 'tool result' blocks to match the 'tool use' blocks
      const toolResultContentBlocks: ToolResultBlockParam[] = [];

      for (const toolUseContentBlock of toolUseContentBlocks) {
        const toolName = toolUseContentBlock.name;
        const toolInput = toolUseContentBlock.input;
        const toolUseId = toolUseContentBlock.id;

        console.log({ toolName, toolInput });

        const toolHandler = toolHandlers[toolName];

        if (!toolHandler) {
          throw new Error("No handler found for tool: " + toolName);
        }

        const toolOutput = await toolHandler(toolInput);
        console.log({ toolOutput });

        toolResultContentBlocks.push({
          type: 'tool_result',
          tool_use_id: toolUseId, // this associates the result with the 'tool_use' request
          content: [{ type: 'text', text: JSON.stringify(toolOutput) }]
        });
      }

      const toolResultMessage: MessageParam = {
        role: 'user',
        content: toolResultContentBlocks,
      }

      // Add the tool result message to the new messages, for the next loop iteration
      newMessages.push(toolResultMessage);

      console.log('newMessages at the end of the loop');
      console.log(newMessages);
    }
  } while (stopReason === 'tool_use');

}

main();
