import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export async function POST() {
  try {
   
    // console.log('Checking environment variables...');
    // console.log('PINECONE_API_KEY exists:', !!process.env.PINECONE_API_KEY);
    // console.log('PINECONE_API_KEY length:', process.env.PINECONE_API_KEY?.length);
    // console.log('PINECONE_API_KEY starts with:', process.env.PINECONE_API_KEY?.substring(0, 4));
    // console.log('PINECONE_ENVIRONMENT:', process.env.PINECONE_ENVIRONMENT);
    // console.log('PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME);

    if (!process.env.PINECONE_API_KEY) {
      throw new Error('Missing PINECONE_API_KEY environment variable');
    }
    if (!process.env.PINECONE_ENVIRONMENT) {
      throw new Error('Missing PINECONE_ENVIRONMENT environment variable');
    }
    if (!process.env.PINECONE_INDEX_NAME) {
      throw new Error('Missing PINECONE_INDEX_NAME environment variable');
    }

    if (!process.env.PINECONE_API_KEY.startsWith('pcsk_')) {
      throw new Error('Invalid Pinecone API key format. API key should start with "pcsk_"');
    }

    // console.log('Initializing Pinecone client...');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // console.log('Creating new index...');
    try {
      await pinecone.createIndex({
        name: process.env.PINECONE_INDEX_NAME,
        dimension: 1536, // OpenAI's text-embedding-3-small dimension
        spec: {
          serverless: {
            cloud: 'aws',
            region: process.env.PINECONE_ENVIRONMENT,
          },
        },
      });
      // console.log('Successfully created new index');
      return NextResponse.json({
        success: true,
        message: 'Pinecone index created successfully with 1536 dimensions',
      });
    } catch (createError: any) {
      if (createError.message.includes('ALREADY_EXISTS')) {
        // console.log('Index already exists, continuing...');
        return NextResponse.json({
          success: true,
          message: 'Pinecone index already exists',
        });
      }
      
      console.error('Error creating index:', createError);
      throw new Error(`Failed to create index: ${createError.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    // console.error('Error setting up Pinecone:', error);
    return NextResponse.json(
      { 
        error: 'Failed to setup Pinecone index',
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 