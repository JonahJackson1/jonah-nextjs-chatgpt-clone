import Head from "next/head";
import Link from "next/link";

import { useUser } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const { user, isLoading, error } = useUser();

  if (isLoading) return <div>...loading</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <>
      <Head>
        <title>ChatGPT Clone - Login or Signup</title>
      </Head>
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-800 text-center text-white">
        <div>
          <div>
            <FontAwesomeIcon
              icon={faRobot}
              className="mb-2 text-6xl text-emerald-200"
            />
          </div>
          <h1 className="text-5xl font-bold">Welcome to ChatGPT Clone</h1>
          <p className="mt-2 text-2xl">Log in with your account to continue</p>
          <div className="mt-4 flex justify-center gap-3">
            {!user && (
              <>
                <Link href="/api/auth/login" className="btn text-2xl">
                  Login
                </Link>
                <Link href="/api/auth/signup" className="btn text-2xl">
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  const session = await getSession(req, res);
  if (session) {
    return {
      redirect: {
        destination: "/chat",
      },
    };
  }
  return {
    props: {},
  };
}
