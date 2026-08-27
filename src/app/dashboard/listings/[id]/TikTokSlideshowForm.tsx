"use client";

import { useState } from "react";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 7;

type Photo = { id: string; photo_url: string };

export default function TikTokSlideshowForm({
  listingId,
  photos,
}: {
  listingId: string;
  photos: Photo[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(photos.slice(0, MAX_PHOTOS).map((p) => p.id))
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_PHOTOS) {
        next.add(id);
      }
      return next;
    });
  }

  const count = selected.size;
  const valid = count >= MIN_PHOTOS && count <= MAX_PHOTOS;

  if (photos.length < MIN_PHOTOS) {
    return (
      <p className="text-sm text-zinc-500">
        Add at least {MIN_PHOTOS} photos to this listing to generate a TikTok slideshow.
      </p>
    );
  }

  return (
    <form
      action={`/api/listings/${listingId}/generate-tiktok-slideshow`}
      method="post"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap gap-2">
        {photos.map((photo) => {
          const isSelected = selected.has(photo.id);
          return (
            <label
              key={photo.id}
              className={`relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded border-2 ${
                isSelected ? "border-brand" : "border-transparent"
              }`}
            >
              <input
                type="checkbox"
                name="photo_ids"
                value={photo.id}
                checked={isSelected}
                onChange={() => toggle(photo.id)}
                className="sr-only"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static local asset */}
              <img
                src={photo.photo_url}
                alt=""
                className={`h-full w-full object-cover ${isSelected ? "" : "opacity-40"}`}
              />
              {isSelected && (
                <span className="bg-brand absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white">
                  &#10003;
                </span>
              )}
            </label>
          );
        })}
      </div>

      <p className="text-xs text-zinc-600">
        {count} of {MIN_PHOTOS}-{MAX_PHOTOS} photos selected — the order above is used as the
        slide order, and the last photo becomes the closing &quot;contact me&quot; slide.
      </p>

      <button
        type="submit"
        disabled={!valid}
        className="bg-brand hover:bg-brand-dark h-11 w-fit rounded-full px-6 text-sm font-medium text-white transition-colors disabled:opacity-40"
      >
        Generate TikTok slideshow
      </button>
    </form>
  );
}
