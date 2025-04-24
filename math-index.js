import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});

const userPrompt = 'Sum 345234345 and 3123146472'

const mainPrompt = `You are a math assistant. If a user asks you to sum 2 numbers, use the sum tool.
    If the user asks you any other question, reply with "NO".
    To use the sum tool, reply with "SUM" and the 2 numbers you want to sum.
    For example: "SUM 2 3".`

async function getCompletion(systemPrompt, userPrompt) {
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [{
        role: 'system',
        content: systemPrompt
      }, {
        role: 'user',
        content: userPrompt
      }],
    });

    return chatResponse.choices[0].message.content
}

const response = await getCompletion(mainPrompt, userPrompt);

if (response.startsWith('SUM')) {
    const numbers = response.split(' ').slice(1).map(Number);
    const sum = numbers.reduce((a, b) => a + b, 0);
    console.log('Sum:', sum);
} else {
    console.log('Chat:', response);
}