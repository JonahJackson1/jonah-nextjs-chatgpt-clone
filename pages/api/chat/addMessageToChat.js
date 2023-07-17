import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function addMessageToChat(req, res) {
  try {
    const { user } = await getSession(req, res);
    const client = await clientPromise;
    const db = client.db("ChatGPTClone");
    const { chatId, role, content } = req.body;

    // validate objectId
    let objectId;

    try {
      objectId = new ObjectId(chatId);
    } catch (e) {
      res.status(422).json({ message: "invalid chat ID" });
      return;
    }

    // validate message data
    if (
      !content ||
      typeof content !== "string" ||
      (role === "user" && content.length > 200) ||
      (role === "assistant" && content.length > 100_000)
    ) {
      res.status(422).json({
        message: "Content is required and must be less than 200 characters",
      });
      return;
    }

    // validate role

    if (role !== "user" && role !== "assistant") {
      res.status(422).json({
        message: 'role must either be "assistant" or "user"',
      });
      return;
    }

    const chat = await db.collection("chats").findOneAndUpdate(
      {
        _id: new ObjectId(objectId),
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
