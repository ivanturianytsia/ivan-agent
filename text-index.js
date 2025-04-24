import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});

const userPrompt = 'Write a poem'

let currentText = ''

const mainPrompt = `You are a writing assistant. If a user asks you to write something or edit text, use the EDIT tool.
    If the user asks you any other question, reply with "NO".
    To use the edit tool, reply with "EDIT" and: text you want to replace (<from></from>), and text you want to replace it with (<to></to>).
    For example: "EDIT <from>cat</from> <to>dog</to>". Current text:
    """
    `

async function getCompletion(systemPrompt, userPrompt) {
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [{
        role: 'system',
        content: systemPrompt + currentText
      }, {
        role: 'user',
        content: userPrompt
      }],
    });

    return chatResponse.choices[0].message.content
}

const response = await getCompletion(mainPrompt, userPrompt);

if (response.startsWith('EDIT')) {
    const from = response.split('<from>')[1].split('</from>')[0];
    const to = response.split('<to>')[1].split('</to>')[0];
    console.log('Using EDIT tool...\n');
    currentText = currentText.replace(from, to);
    console.log('Current text:', currentText);
} else {
    console.log('Chat:', response);
}
