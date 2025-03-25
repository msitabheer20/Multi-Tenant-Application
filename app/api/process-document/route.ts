import { NextResponse } from 'next/server';
import { upsertDocument } from '@/lib/pinecone';
import { pinecone } from '@/lib/pinecone';

export async function POST(req: Request) {
  try {
    console.log('\n=== Processing Document API Call ===');
    const { fileId, content } = await req.json();

    if (!fileId || !content) {
      console.error('Missing required fields:', { fileId, hasContent: !!content });
      return NextResponse.json(
        { error: 'File ID and content are required' },
        { status: 400 }
      );
    }

    // console.log('Document details:', {
    //   fileId,
    //   contentLength: content.length,
    //   contentPreview: content.substring(0, 200) + '...'
    // });

    // Process and store the document in Pinecone
    // console.log('\nStarting document processing...');
    const numChunks = await upsertDocument(fileId, content);
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    // const stats = await index.describeIndexStats();

    // const queryResponse = await index.query({
    //   vector: new Array(1536).fill(0), // Zero vector to get all matches
    //   topK: 1,
    //   filter: {
    //     fileId: { $eq: fileId },
    //   },
    //   includeMetadata: true,
    // });

    // console.log('\n=== Document Processing Complete ===');
    // console.log('Document processed successfully:', {
    //   fileId,
    //   numChunks,
    //   averageChunkSize: Math.round(content.length / numChunks)
    // });

    return NextResponse.json({
      success: true,
      message: `Document processed and stored in ${numChunks} chunks`,
    });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process the document' },
      { status: 500 }
    );
  }
} 