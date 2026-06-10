const axios = require("axios");

const askGroq = async (
  messages
) => {

  const response =
    await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model:
          "llama-3.3-70b-versatile",

        messages,

        temperature: 0.5,

        max_tokens: 1200
      },
      {
        headers: {
          Authorization:
            `Bearer ${process.env.GROQ_API_KEY}`
        }
      }
    );

  return response.data
    .choices[0]
    .message.content;
};

module.exports = askGroq;