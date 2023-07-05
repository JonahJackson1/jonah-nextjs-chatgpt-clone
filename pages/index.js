import Head from "next/head";
import Link from "next/link";

import { useUser } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";

export default function Home() {
  const { user, isLoading, error } = useUser();

  if (isLoading) return <div>...loading</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div>
      <Head>
        <title>ChatBBW</title>
      </Head>

      <div className="flex min-h-screen w-full items-center justify-center bg-gray-800">
        {!user && (
          <>
            <Link
              href="/api/auth/login"
              className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
            >
              Login
            </Link>
            <Link
              href="/api/auth/signup"
              className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
            >
              Sign up
            </Link>
          </>
        )}
        {user && (
          <Link
            href="/api/auth/logout"
            className="rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
          >
            Logout
          </Link>
        )}
      </div>
    </div>
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
