"use client";

import { useRef, useState, useTransition } from "react";
import { createListing, importListingFromUrl } from "./actions";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "just_listed", label: "Just listed" },
  { value: "pending", label: "Pending" },
  { value: "sold", label: "Sold" },
];

const inputClass = "rounded border border-black/10 bg-white px-3 py-2 text-sm";

export default function ListingForm({ hasQuota }: { hasQuota: boolean }) {
  const [importUrl, setImportUrl] = useState("");
  const [importPending, startImport] = useTransition();
  const [importError, setImportError] = useState<string | null>(null);
  const [importedNotice, setImportedNotice] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const addressRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const bedsRef = useRef<HTMLInputElement>(null);
  const bathsRef = useRef<HTMLInputElement>(null);
  const sqftRef = useRef<HTMLInputElement>(null);
  const mlsRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  function handleImport() {
    const url = importUrl.trim();
    if (!url) return;
    setImportError(null);
    setImportedNotice(null);
    startImport(async () => {
      const result = await importListingFromUrl(url);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      const l = result.listing;
      if (addressRef.current && l.address) addressRef.current.value = l.address;
      if (cityRef.current && l.city) cityRef.current.value = l.city;
      if (stateRef.current && l.state) stateRef.current.value = l.state;
      if (zipRef.current && l.zip) zipRef.current.value = l.zip;
      if (priceRef.current && l.price !== null) priceRef.current.value = String(l.price);
      if (bedsRef.current && l.beds !== null) bedsRef.current.value = String(l.beds);
      if (bathsRef.current && l.baths !== null) bathsRef.current.value = String(l.baths);
      if (sqftRef.current && l.sqft !== null) sqftRef.current.value = String(l.sqft);
      if (mlsRef.current && l.mlsNumber) mlsRef.current.value = l.mlsNumber;
      if (descriptionRef.current && l.description) descriptionRef.current.value = l.description;
      setPhotoUrls(l.photoUrls);
      setImportedNotice("Imported — review the fields below before saving, everything stays editable.");
    });
  }

  function removePhoto(url: string) {
    setPhotoUrls((prev) => prev.filter((p) => p !== url));
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-4">
        <div>
          <h2 className="text-sm font-bold text-black">Import from a listing URL</h2>
          <p className="mt-1 text-xs text-zinc-600">
            Paste the link to this listing on your own website — we&apos;ll try to pull the
            address, price, beds/baths/sqft, and photos. Everything below stays editable, so
            you can also just fill it in by hand instead.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://yoursite.com/listing/123-main-st"
            className={`flex-1 ${inputClass}`}
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importPending || !importUrl.trim()}
            className="border-brand text-brand h-9 flex-shrink-0 rounded-full border px-4 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:opacity-40"
          >
            {importPending ? "Importing…" : "Import"}
          </button>
        </div>
        {importError && <p className="text-sm text-red-600">{importError}</p>}
        {importedNotice && <p className="text-sm text-green-600">{importedNotice}</p>}
      </div>

      <form
        action={createListing}
        className={`flex flex-col gap-6 ${!hasQuota ? "pointer-events-none opacity-40" : ""}`}
      >
        {photoUrls.map((url) => (
          <input key={url} type="hidden" name="imported_photo_urls" value={url} />
        ))}

        <label className="flex flex-col gap-1 text-sm">
          Address
          <input ref={addressRef} name="address" required className={inputClass} />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            City
            <input ref={cityRef} name="city" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            State
            <input ref={stateRef} name="state" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Zip
            <input ref={zipRef} name="zip" className={inputClass} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            Price
            <input ref={priceRef} name="price" type="number" min="0" step="1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Beds
            <input ref={bedsRef} name="beds" type="number" min="0" step="1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Baths
            <input ref={bathsRef} name="baths" type="number" min="0" step="0.5" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Sqft
            <input ref={sqftRef} name="sqft" type="number" min="0" step="1" className={inputClass} />
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
            <input ref={mlsRef} name="mls_number" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Description
          <textarea ref={descriptionRef} name="description" rows={4} className={inputClass} />
        </label>

        {photoUrls.length > 0 && (
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-black">Imported photos ({photoUrls.length})</span>
            <div className="flex flex-wrap gap-2">
              {photoUrls.map((url) => (
                <div key={url} className="relative h-20 w-20 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element -- external source-site photo, not a static local asset */}
                  <img
                    src={url}
                    alt=""
                    className="h-20 w-20 rounded border border-black/10 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    aria-label="Remove photo"
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="flex flex-col gap-2 text-sm">
          {photoUrls.length > 0 ? "Additional photos" : "Photos"}
          <input name="photos" type="file" accept="image/*" multiple />
          <span className="text-xs text-zinc-600">
            {photoUrls.length > 0
              ? "Add more, or leave blank to use only the imported photos above."
              : "The first photo you select is used as the hero image."}
          </span>
        </label>

        <button
          type="submit"
          disabled={!hasQuota}
          className="bg-brand hover:bg-brand-dark h-11 w-fit rounded-full px-6 text-sm font-medium text-white transition-colors disabled:opacity-40"
        >
          Save listing
        </button>
      </form>
    </>
  );
}
