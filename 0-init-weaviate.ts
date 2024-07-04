import weaviate, { type CollectionConfigCreate } from "weaviate-client";

const noteCollectionSchema: CollectionConfigCreate = {
  name: 'Note',
  properties: [{
    name: 'content',
    dataType: 'text',
  },
  {
    name: 'context',
    dataType: 'text'
  },
  {
    name: 'createdAt',
    dataType: 'date',
  }
  ]
}

async function main() {

  // Connect to local Weaviate database
  const weaviateClient = await weaviate.connectToLocal();

  // Check if the note collection exists, and delete if it does exist
  const noteCollectionExists = await weaviateClient.collections.exists('Note');
  if (noteCollectionExists) {
    console.log('Deleting existing collection...');
    await weaviateClient.collections.delete('Note');
  }

  // Create the new collection
  await weaviateClient.collections.create(noteCollectionSchema);

  console.log('Successfully created collection');

  const exampleNote = {
    content: `# Tips for writing effective blog posts
- Choose a clear, focused topic for each post
- Use descriptive headlines that grab attention
- Break up text with subheadings, bullet points, and short paragraphs
- Include relevant images, charts or infographics
- Write in a conversational, engaging tone
- Provide actionable takeaways for readers
- Optimize for SEO with relevant keywords
- End with a strong call-to-action`
    ,
    context: 'User wants to improve their blog writing skills',
    createdAt: new Date()
  }

  // Insert the example note into the note collection
  const notesCollection = weaviateClient.collections.get('Note');
  await notesCollection.data.insert(exampleNote);
}
main();
