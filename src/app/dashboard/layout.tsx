import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="bg-cream flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4 sm:px-10">
        <Link href="/dashboard" className="text-brand text-lg font-black tracking-tight">
          Real Estate Marketing Kit
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="hover:text-brand text-sm font-medium text-black transition-colors"
          >
            Home
          </Link>
          <Link
            href="/dashboard/listings"
            className="hover:text-brand text-sm font-medium text-black transition-colors"
          >
            Listings
          </Link>
          <Link
            href="/dashboard/brand-kit"
            className="hover:text-brand text-sm font-medium text-black transition-colors"
          >
            Brand kit
          </Link>
          <UserButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
