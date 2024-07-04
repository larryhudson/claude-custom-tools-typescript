# Tutorial: Extending Claude's abilities with custom tools

This repository contains a few scripts that accompany this video tutorial below.

[![Video tutorial](https://img.youtube.com/vi/C-fyjyv7xpE/0.jpg)](https://www.youtube.com/watch?v=C-fyjyv7xpE)

In these scripts, we:
1. Use the `@anthropic-ai/sdk` client library to interact with the Anthropic API and get messages from Claude.
2. Define custom tools for Claude to use, and include them in our request
3. Execute a 'tool handler' function to get the tool's output
4. Pass the tool result back to Claude to generate a message using the result as context.

## Useful resources
- [Anthropic's documentation for tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use#handling-tool-use-and-tool-result-content-blocks)
- [Anthropic's free tool use course](https://github.com/anthropics/courses/tree/master/ToolUse)

## Prerequisites

To get this up and running on your own computer, you'll need:
- Node.js
- Git - for cloning this repository
- Docker - for running the Weaviate vector database. If you are using macOS, I recommend using [OrbStack](https://orbstack.dev/).
- An [Anthropic API account](https://console.anthropic.com/)
- An [OpenAI API key](https://platform.openai.com/) (for the Weaviate vector database embeddings)

## Set up instructions
1. Clone this repository, then move into the directory and run `npm install` to install the dependencies:
```
git clone <clone url>
cd claude-custom-tools-typescript
npm install
```
2. Duplicate the `.env.sample` file as `.env` and fill in your API keys.

3. Set up the Weaviate vector database. Make sure you have Docker running, and then use `docker-compose` to start the Weaviate container:
```
docker-compose --env-file=.env up -d
```

Then run the initialisation script to create the 'Note' collection and insert an example note.

```
npx tsx 0-init-weaviate.ts
```

You will now be ready to run the demo scripts in your terminal. You can use `npx tsx` followed by a filename:
```
npx tsx 1-simple-message.ts
```
