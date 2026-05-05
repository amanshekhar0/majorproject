import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testGrok() {
    const key = process.env.XAI_API_KEY;
    console.log('Testing key:', key ? key.substring(0, 10) + '...' : 'MISSING');
    
    if (!key) {
        console.error('XAI_API_KEY is not set');
        return;
    }

    const openai = new OpenAI({
        apiKey: key,
        baseURL: 'https://api.x.ai/v1',
    });

    try {
        console.log('Listing available models for this key...');
        const models = await openai.models.list();
        console.log('Available models:');
        models.data.forEach(m => console.log(' -', m.id));
    } catch (err: any) {
        console.error('Error connecting to xAI:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
        if (err.status) console.error('Error status:', err.status);
    }
}

testGrok();
