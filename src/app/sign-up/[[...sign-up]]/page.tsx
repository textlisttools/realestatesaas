import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="bg-cream flex flex-1 flex-col">
      <header className="px-6 py-5 sm:px-12">
        <Link href="/" className="text-brand text-lg font-black tracking-tight">
          Real Estate Marketing Kit
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center py-16">
        <SignUp />
      </div>
    </div>
  );
}
