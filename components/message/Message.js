import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

export default function Message({ role, content }) {
  const { user } = useUser();

  return (
    <div
      className={`grid grid-cols-[30px_1fr] gap-5 p-5 ${
        role === "assistant" ? "bg-gray-600" : ""
      }`}
    >
      <div>
        {user && role === "user" && (
          <Image
            src={user.picture}
            width={30}
            height={30}
            alt="user avatar"
            className="shadow-black/500 rounded-sm shadow-md"
          />
        )}
        {role === "assistant" && (
          <div className="item-center shadow-black/500 flex h-[30px] w-[30px] justify-center rounded-sm bg-gray-800 shadow-md">
            <FontAwesomeIcon icon={faRobot} className="text-emerald-200" />
          </div>
        )}
      </div>
      <div>{content}</div>
    </div>
  );
}
