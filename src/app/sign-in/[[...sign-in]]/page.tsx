import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="bg-cream flex flex-1 items-center justify-center py-16">
      <SignIn />
    </div>
  );
}
