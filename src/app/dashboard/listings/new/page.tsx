import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { createListing } from "./actions";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "just_listed", label: "Just listed" },
  { value: "pending", label: "Pending" },
  { value: "sold", label: "Sold" },
];

const inputClass =
  "rounded border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-black";

export default async function NewListingPage() {
  await auth.protect();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New listing</h1>
        <Link href="/dashboard/listings" className="text-sm text-gray-500 hover:underline">
          Back to listings
        </Link>
      </div>

      <form action={createListing} className="flex flex-col gap-6">
        <label className="flex flex-col gap-1 text-sm">
          Address
          <input name="address" required className={inputClass} />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            City
            <input name="city" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            State
            <input name="state" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Zip
            <input name="zip" className={inputClass} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            Price
            <input name="price" type="number" min="0" step="1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Beds
            <input name="beds" type="number" min="0" step="1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Baths
            <input name="baths" type="number" min="0" step="0.5" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Sqft
            <input name="sqft" type="number" min="0" step="1" className={inputClass} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Status
            <select name="status" defaultValue="active" className={inputClass}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            MLS number
            <input name="mls_number" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Description
          <textarea name="description" rows={4} className={inputClass} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          Photos
          <input name="photos" type="file" accept="image/*" multiple />
          <span className="text-xs text-gray-500">
            The first photo you select is used as the hero image.
          </span>
        </label>

        <button
          type="submit"
          className="h-11 w-fit rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Save listing
        </button>
      </form>
    </div>
  );
}
