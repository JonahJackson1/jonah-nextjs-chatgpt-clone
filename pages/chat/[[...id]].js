// packaghes
import Head from "next/head";
import { useEffect, useState } from "react";
import { streamReader } from "openai-edge-stream";
import { v4 as uuid } from "uuid";
// components
import ChatSideBar from "components/sidebar/ChatSideBar";
import Message from "components/message/Message";
import { useRouter } from "next/router";
import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default function ChatPage({ id, title, messages = [] }) {
  const [newChatId, setNewChatId] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState("");
  const [messageText, setMessageText] = useState("");
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [fullMsg, setFullMsg] = useState("");
  const router = useRouter();

  // when route changes reset state
  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);
  }, [id]);

  // save new messages to chat messages
  useEffect(() => {
    if (!generatingResponse && fullMsg)
      setNewChatMessages((prev) => [
        ...prev,
        {
          _id: uuid(),
          role: "assistant",
          content: fullMsg,
        },
      ]);
    setFullMsg("");
  }, [generatingResponse, fullMsg]);

  // if new chat
  useEffect(() => {
    if (!generatingResponse && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }
  }, [newChatId, generatingResponse, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneratingResponse(true);

    setNewChatMessages((prev) => [
      ...prev,
      {
        _id: uuid(),
        role: "user",
        content: messageText,
      },
    ]);
    setMessageText("");

    const response = await fetch("/api/chat/sendMessage", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ chatId: id, message: messageText }),
    });

    const data = response.body;
    if (!data) return;

    const reader = data.getReader();
    let content = "";
    await streamReader(reader, (message) => {
      if (message.event === "newChatId") {
        setNewChatId(message.content);
      } else {
        setIncomingMessage((prev) => `${prev}${message.content}`);
        content = content + message.content;
      }
    });
    setFullMsg(content);
    setIncomingMessage("");
    setGeneratingResponse(false);
  }

  const allMessages = [...messages, ...newChatMessages];

  return (
    <>
      <Head>
        <title>New chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSideBar id={id} />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex-1 overflow-y-scroll text-white">
            {allMessages.map((message) => (
              <Message
                key={message._id}
                role={message.role}
                content={message.content}
              />
            ))}
            {incomingMessage && (
              <Message role="assistant" content={incomingMessage} />
            )}
          </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit} disabled={generatingResponse}>
              <fieldset className="flex gap-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={generatingResponse ? "" : "Send a message..."}
                  className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                />
                <button type="submit" className="btn">
                  Send
                </button>
              </fieldset>
            </form>
          </footer>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const id = context.params?.id?.[0] || null;
  if (id) {
    const { user } = await getSession(context.req, context.res);
    const client = await clientPromise;
    const db = client.db("ChatGPTClone");
    const chat = await db.collection("chats").findOne({
      _id: new ObjectId(id),
      userId: user.sub,
    });
    return {
      props: {
        id,
        title: chat.title,
        messages: chat.messages.map((msg) => ({ ...msg, _id: uuid() })),
      },
    };
  }
  return {
    props: { id: id },
  };
}
