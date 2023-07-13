import { OpenAIEdgeStream } from "openai-edge-stream";

// edge runtime
export const config = {
  runtime: "edge",
};

export default async function sendMessage(req) {
  try {
    const { chatId: chatIdFromParam, message } = await req.json();
    let chatId = chatIdFromParam;
    const initialChatMessage = {
      role: "system",
      content:
        "Your name is Chatty Pete and incredibly intelligent and quick thinking AI that always replies with an enthusiastic and positive energy. You were created by web dev education and your response must be formatted as markdown.",
    };

    let newChatId;

    if (chatId) {
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/addMessageToChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            chatId,
            role: "user",
            content: message,
          }),
        }
      );
    } else {
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/createNewChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({ message }),
        }
      );

      const json = await response.json();

      chatId = json._id;
      newChatId = json._id;
    }

    const stream = await OpenAIEdgeStream(
      "https://api.openai.com/v1/chat/completions",
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [initialChatMessage, { content: message, role: "user" }],
          stream: true,
        }),
      },
      {
        onBeforeStream: async ({ emit }) => {
          if (newChatId) emit(chatId, "newChatId");
        },
        onAfterStream: async ({ fullContent }) => {
          try {
            await fetch(
              `${req.headers.get("origin")}/api/chat/addMessageToChat`,
              {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  cookie: req.headers.get("cookie"),
                },
                body: JSON.stringify({
                  chatId,
                  role: "assistant",
                  content: fullContent,
                }),
              }
            );
          } catch (err) {
            console.log(err);
          }
        },
      }
    );

    return new Response(stream);
  } catch (err) {
    console.log(err);
    return new Response(err);
  }
}
