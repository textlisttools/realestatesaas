import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Real Estate Marketing Kit
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Turn a listing into a branded flyer and Instagram post/story in
          minutes.
        </p>

        <Show when="signed-out">
          <div className="flex gap-4 text-base font-medium">
            <Link
              className="flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
              href="/sign-up"
            >
              Get started
            </Link>
            <Link
              className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-6 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
              href="/sign-in"
            >
              Sign in
            </Link>
          </div>
        </Show>

        <Show when="signed-in">
          <div className="flex items-center gap-4">
            <Link
              className="flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
              href="/dashboard"
            >
              Go to dashboard
            </Link>
            <UserButton />
          </div>
        </Show>
      </main>
    </div>
  );
}
