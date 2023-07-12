import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";

export default async function addMessageToChat(req, res) {
  try {
    const { user } = await getSession();
    const client = await clientPromise;
    const db = client.db("ChatGPTClone");

    const { chatId, role, content } = req.body;
    console.log(chatId, role, content);

    const chat = await db.collection("chats").findOneAndUpdate(
      {
        _id: new ObjectId(chatId),
        userId: user.sub,
      },
      {
        $push: {
          messages: {
            role,
            content,
          },
        },
      },
      {
        returnDocument: "after",
      }
    );

    console.log("HERE123");

    res.status(200).json({
      chat: {
        ...chat.value,
        _id: chat.value._id.toString(),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred when adding a message to a chat" });
  }
}