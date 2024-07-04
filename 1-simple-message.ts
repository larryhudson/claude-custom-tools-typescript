import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

// initialise the Anthropic client - by default it will use the 'ANTHROPIC_API_KEY' environment variable
const anthropic = new Anthropic();

async function main() {

  const userMessage = 'What is your name?';

  console.log('User:', userMessage);

  // Ask the assistant for a message
  const claudeResponse = await anthropic.messages.create({
    messages: [{ role: 'user', content: userMessage }],
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
  });

  console.log("Full API response:");
  console.log(JSON.stringify(claudeResponse, null, 2))

  console.log('Assistant:', claudeResponse.content[0].text);
}

main();
