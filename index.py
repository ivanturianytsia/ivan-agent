import os
import re
from flask import Flask, request, jsonify
from mistralai import Mistral

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("MISTRAL_API_KEY")
client = Mistral(api_key=api_key)

main_prompt = """
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
"""

def get_completion(system_prompt, user_prompt):
    chat_response = client.chat.complete(
        model="mistral-large-latest",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return chat_response.choices[0].message.content

def get_replace_tool_result(current_text, response):
    match = re.search(r"<replace-tool>([\s\S]*?)</replace-tool>", response)
    if not match:
        return {"new_text": current_text}

    params = match.group(1).strip()
    from_text = re.search(r"<from>([\s\S]*?)</from>", params).group(1)
    to_text = re.search(r"<to>([\s\S]*?)</to>", params).group(1)

    new_text = current_text.replace(from_text, to_text)
    return {"new_text": new_text}

app = Flask(__name__, static_folder=".")

@app.route("/", methods=["GET"])
def index():
    return app.send_static_file("index.html")

@app.route("/api/edit", methods=["POST"])
def api_edit():
    data = request.json
    current_text = data.get("currentText", "")
    user_prompt = data.get("userPrompt", "")

    system_prompt = f"{main_prompt}<currentText>{current_text}</currentText>"
    response = get_completion(system_prompt, user_prompt)
    result = get_replace_tool_result(current_text, response)

    return jsonify({
        "response": response.split("<replace-tool>")[0].strip(),
        "newText": result["new_text"],
    })

if __name__ == "__main__":
    app.run(port=3000)