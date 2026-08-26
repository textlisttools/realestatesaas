import { UserButton } from "@clerk/nextjs";
import { getOrCreateAgent } from "@/lib/agents";

export default async function DashboardPage() {
  const agent = await getOrCreateAgent();

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <UserButton />
      </div>
      <p className="text-sm text-gray-500">
        Signed in as {agent.email ?? agent.clerk_user_id}. Brand kit
        onboarding and listings management land here in the next steps.
      </p>
    </div>
  );
}
