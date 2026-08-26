import Link from "next/link";
import { getOrCreateAgent } from "@/lib/agents";
import { updateBrandKit } from "./actions";

const FONT_CHOICES = [
  { value: "inter", label: "Inter" },
  { value: "playfair", label: "Playfair Display" },
  { value: "montserrat", label: "Montserrat" },
  { value: "roboto-slab", label: "Roboto Slab" },
];

const inputClass =
  "rounded border border-black/10 bg-white px-3 py-2 text-sm";

export default async function BrandKitPage() {
  const agent = await getOrCreateAgent();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-brand text-2xl font-black tracking-tight">Brand kit</h1>
          <p className="text-sm text-zinc-500">
            Shows up on every flyer and social post you generate.
          </p>
        </div>
        <Link href="/dashboard" className="hover:text-brand text-sm text-zinc-500">
          Back to dashboard
        </Link>
      </div>

      <form action={updateBrandKit} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input name="name" defaultValue={agent.name ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Brokerage
            <input name="brokerage" defaultValue={agent.brokerage ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Phone
            <input
              name="phone"
              type="tel"
              defaultValue={agent.phone ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Font
            <select name="font_choice" defaultValue={agent.font_choice} className={inputClass}>
              {FONT_CHOICES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Primary color
            <input
              name="brand_primary_color"
              type="color"
              defaultValue={agent.brand_primary_color}
              className="h-10 w-full rounded border border-black/10"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Secondary color
            <input
              name="brand_secondary_color"
              type="color"
              defaultValue={agent.brand_secondary_color}
              className="h-10 w-full rounded border border-black/10"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Logo
            {agent.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static local asset
              <img
                src={agent.logo_url}
                alt="Current logo"
                className="h-16 w-16 rounded border border-black/10 object-contain"
              />
            )}
            <input name="logo" type="file" accept="image/*" />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Headshot
            {agent.headshot_url && (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static local asset
              <img
                src={agent.headshot_url}
                alt="Current headshot"
                className="h-16 w-16 rounded-full border border-black/10 object-cover"
              />
            )}
            <input name="headshot" type="file" accept="image/*" />
          </label>
        </div>

        <button
          type="submit"
          className="bg-brand hover:bg-brand-dark h-11 w-fit rounded-full px-6 text-sm font-medium text-white transition-colors"
        >
          Save brand kit
        </button>
      </form>
    </div>
  );
}
