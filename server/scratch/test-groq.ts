import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testGroq() {
    const key = process.env.GROQ_API_KEY;
    console.log('GROQ key:', key ? key.substring(0, 12) + '...' : 'MISSING');

    if (!key) {
        console.error('GROQ_API_KEY not found in .env');
        return;
    }

    const client = new OpenAI({
        apiKey: key,
        baseURL: 'https://api.groq.com/openai/v1',
    });

    try {
        console.log('Sending test request to Groq...');
        const result = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
            max_tokens: 50,
        });
        console.log('✅ SUCCESS! Response:', result.choices[0]?.message?.content);
    } catch (err: any) {
        console.error('❌ FAILED:', err.status, err.message);
    }
}

testGroq();
