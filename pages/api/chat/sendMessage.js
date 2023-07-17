import { OpenAIEdgeStream } from "openai-edge-stream";

// edge runtime
export const config = {
  runtime: "edge",
};

export default async function sendMessage(req) {
  try {
    const { chatId: chatIdFromParam, message } = await req.json();

    // validate message data
    if (!message || typeof message !== "string" || message.length > 200) {
      return new Response(
        { message: "message is required and must be less than 200 characters" },
        { status: 422 }
      );
    }

    let chatId = chatIdFromParam;
    const initialChatMessage = {
      role: "system",
      content:
        "Your name is Chatty Pete and incredibly intelligent and quick thinking AI that always replies with an enthusiastic and positive energy. You were created by web dev education and your response must be formatted as markdown.",
    };

    let newChatId;
    let chatMsgs = [];

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
      const json = await response.json();
      chatMsgs = json.chat.messages || [];
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
      chatMsgs = json.messages || [];
      chatId = json._id;
      newChatId = json._id;
    }

    const messagesToInclude = [];
    chatMsgs.reverse();

    let usedTokens = 0;

    for (const msg of chatMsgs) {
      const messageTokens = msg.content.length / 4;
      usedTokens += messageTokens;
      if (usedTokens <= 2000) {
        messagesToInclude.push(msg);
      } else {
        break;
      }
    }

    messagesToInclude.reverse();

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
          messages: [initialChatMessage, ...messagesToInclude],
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
    return new Response(
      { message: "An error occurred in sendMessage" },
      { status: 500 }
    );
  }
}
