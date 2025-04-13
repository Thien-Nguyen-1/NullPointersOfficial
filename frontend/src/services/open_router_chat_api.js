
import Groq from 'groq-sdk'
const groq = new Groq({apiKey : import.meta.env.VITE_GROQ_API_KEY || "", dangerouslyAllowBrowser: true })

const promptInfo = {
    tags: null,
    usrResponse: null,
}

export async function GetResult(userResponses, tags_) {
    if (!tags_) {
        return "No tags available"
    } 

    promptInfo.usrResponse = userResponses;
    promptInfo.tags = tags_;

    const repsonse = await SendTest()

    return repsonse;
}


export async function SendTest() {
    const chatCompletion = await groq.chat.completions.create({
      "messages": [
        {
          "role": "user",
          "content": `${promptInfo.usrResponse}`
        },
        {
            "role": "system",
          "content": "You are a mental health professional Return a list of words from the following tags that would seem appropriate/relatable from the user's responses to the questions from the query. " +
          `the tags are ${promptInfo.tags}. Donnot add your thoughts just the list only as comma separated values.`
        }
      ],
      "model": "qwen-2.5-32b",
      "temperature": 0.6,
      "max_completion_tokens": 4096,
      "top_p": 0.95,
      "stream": true,
      "stop": null
    });
    
    const messageContent = { 
        msg: ""
    };
    for await (const chunk of chatCompletion) {

        const content = chunk.choices[0]?.delta?.content;

        if (content && !content.includes('<think>')) {
            messageContent.msg += content;
        }

    }
    console.log(messageContent.msg)
    
    return messageContent.msg;

  }