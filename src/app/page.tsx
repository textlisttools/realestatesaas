import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

const STEPS = [
  {
    n: "1",
    eyebrow: "BRAND KIT",
    title: "Set it once. It shows up everywhere.",
    body: "Upload your logo, headshot, and brand colors. Every flyer and post you generate from here on is automatically on-brand.",
  },
  {
    n: "2",
    eyebrow: "ADD A LISTING",
    title: "Type it in. We handle the layout.",
    body: "Address, price, beds and baths, a few photos. That's the whole form.",
  },
  {
    n: "3",
    eyebrow: "GENERATE ASSETS",
    title: "One click. Three deliverables.",
    body: "A print-ready flyer PDF, an Instagram post, and an Instagram story — sized, branded, and ready to send.",
  },
  {
    n: "4",
    eyebrow: "DOWNLOAD & POST",
    title: "Grab it and go.",
    body: "Download individually or as a zip. No design software, no waiting on a graphic designer.",
  },
];

const PAIN_POINTS = [
  "Canva templates that never quite match your brand",
  "An hour lost formatting a flyer that should take five minutes",
  "Social posts you keep meaning to make and never do",
];

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* Top nav */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-12">
        <span className="text-lg font-black tracking-tight text-black">
          Real Estate Marketing Kit
        </span>
        <Show when="signed-out">
          <Link href="/sign-in" className="text-sm font-medium text-black hover:underline">
            Sign in
          </Link>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-black hover:underline">
              Dashboard
            </Link>
            <UserButton />
          </div>
        </Show>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center px-6 pt-10 pb-20 text-center sm:pt-16">
        <span className="mb-8 inline-flex items-center rounded-full border border-black/15 px-5 py-2 text-sm font-medium text-black">
          Real Estate Marketing Platform
        </span>

        <h1 className="max-w-4xl text-[2.75rem] leading-[1.05] font-black tracking-tight text-black sm:text-6xl sm:leading-[1.05]">
          Turn every listing into a{" "}
          <span className="text-brand italic">marketing kit</span> — before
          you&apos;ve left the driveway.
        </h1>

        <p className="mt-8 max-w-xl text-lg text-zinc-600">
          Add your listing once. Get a print-ready flyer and branded
          Instagram posts — instantly, styled in your colors.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Show when="signed-out">
            <Link
              href="/sign-up"
              className="bg-brand hover:bg-brand-dark flex h-14 items-center gap-2 rounded-full px-8 text-base font-bold text-white transition-colors"
            >
              Get Started Free
              <ArrowIcon />
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="bg-brand hover:bg-brand-dark flex h-14 items-center gap-2 rounded-full px-8 text-base font-bold text-white transition-colors"
            >
              Go to Dashboard
              <ArrowIcon />
            </Link>
          </Show>
        </div>
      </section>

      {/* Problem / agitation */}
      <section className="bg-black px-6 py-24 text-center sm:px-12">
        <h2 className="mx-auto max-w-3xl text-3xl leading-tight font-black text-white sm:text-5xl">
          You&apos;ve got the listing. You don&apos;t have the afternoon.
        </h2>

        <div className="mx-auto mt-16 flex max-w-2xl flex-col gap-10">
          {PAIN_POINTS.map((point) => (
            <div key={point} className="flex flex-col items-center gap-4">
              <span className="text-brand">
                <XCircleIcon />
              </span>
              <p className="text-xl font-medium text-white sm:text-2xl">{point}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-16 max-w-lg text-lg text-zinc-400">
          Every hour spent designing is an hour not spent with your next
          client.
        </p>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 sm:px-12">
        <div className="mx-auto max-w-2xl">
          <span className="text-brand text-sm font-bold tracking-widest">
            HOW IT WORKS
          </span>
          <h2 className="mt-3 text-3xl leading-tight font-black text-black sm:text-5xl">
            One brand kit. One listing form. Every asset — done.
          </h2>

          <div className="mt-16 flex flex-col gap-16">
            {STEPS.map((step) => (
              <div key={step.n} className="flex gap-6">
                <div className="flex flex-shrink-0 flex-col items-center">
                  <span className="bg-brand flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white">
                    {step.n}
                  </span>
                  <span className="mt-2 w-px flex-1 bg-black/10 last:hidden" />
                </div>
                <div className="pb-2">
                  <span className="text-brand text-xs font-bold tracking-widest">
                    {step.eyebrow}
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-black">{step.title}</h3>
                  <p className="mt-3 text-lg text-zinc-600">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand flex flex-col items-center gap-8 px-6 py-20 text-center sm:px-12">
        <h2 className="max-w-2xl text-3xl leading-tight font-black text-white sm:text-5xl">
          Your next listing is one form away.
        </h2>
        <Show when="signed-out">
          <Link
            href="/sign-up"
            className="flex h-14 items-center gap-2 rounded-full bg-white px-8 text-base font-bold text-black transition-colors hover:bg-zinc-100"
          >
            Get Started Free
            <ArrowIcon />
          </Link>
        </Show>
        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="flex h-14 items-center gap-2 rounded-full bg-white px-8 text-base font-bold text-black transition-colors hover:bg-zinc-100"
          >
            Go to Dashboard
            <ArrowIcon />
          </Link>
        </Show>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-zinc-500 sm:px-12">
        © {new Date().getFullYear()} Real Estate Marketing Kit
      </footer>
    </div>
  );
}
