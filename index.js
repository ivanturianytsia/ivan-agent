import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';

import express from 'express';
import bodyParser from 'body-parser';

dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});

const mainPrompt = `
You are a writing assistant.
You can use tools to edit the current text.
If using the tools, place the tool use in the end of your response.
If not using the tools, just write the response for the user.
Don't print the new text in the response, only print the tool use.
You can explain your actions with prose, before tool use.

Example tool use:
<replace-tool>
  <from>old text</from>
  <to>new text</to>
</replace-tool>

Here's the tools at your disposal:
- name: replace-tool
  description: A user asks you to write something or replace text.
  params:
    - name: from
      type: string
      description: text you want to replace.
    - name: to
      type: string
      description: text you want to replace it with.
- name: sum-tool
  description: A user asks you to calculate the sum of 2 numbers.
  params:
    - name: left
      type: number
      description: the first number.
    - name: right
      type: number
      description: the second number.
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
    const {newText} = getReplaceToolResult(currentText, response);


    res.json({
        response: response.split('<replace-tool>')[0].trim(),
        newText,
    });
});

const getReplaceToolResult = (currentText, response) => {
    const replaceToolResponse = response.match(/<replace-tool>([\s\S]*?)<\/replace-tool>/);
    if (!replaceToolResponse) {
        return { newText: currentText };
    }

    const params = replaceToolResponse[1].trim();
    const from = params.match(/<from>([\s\S]*?)<\/from>/)[1];
    const to = params.match(/<to>([\s\S]*?)<\/to>/)[1];

    const newText = currentText.replace(from, to);

    return { newText }
}

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
})