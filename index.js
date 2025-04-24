import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';

import express from 'express';
import bodyParser from 'body-parser';

dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});

const mainPrompt = `
You are a writing assistant. If a user asks you to write something or edit text, use the EDIT tool.
If the user asks you any other question, reply with "NO".
To use the edit tool, reply with "EDIT" and: text you want to replace (<from></from>), and text you want to replace it with (<to></to>).
For example: "EDIT <from>cat</from> <to>dog</to>".
`

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


const app = express();
const port = 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '.' });
});

app.post('/api/edit', async (req, res) => {
    const currentText = req.body.currentText;
    const userPrompt = req.body.userPrompt;

    const systemPrompt = `${mainPrompt}<currentText>${currentText}</currentText>`;

    const response = await getCompletion(systemPrompt, userPrompt);
    

    if (!response.startsWith('EDIT')) {
        return res.status(400).json({ error: 'Can\'t handle this request' });
    }
    
    const from = response.split('<from>')[1].split('</from>')[0];
    const to = response.split('<to>')[1].split('</to>')[0];
    
    const newText = currentText.replace(from, to);

    res.json({
        newText: newText,
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
})