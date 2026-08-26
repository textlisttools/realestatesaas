import Link from "next/link";
import { getOrCreateAgent } from "@/lib/agents";
import { getListingForAgent } from "@/lib/listings";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { AssetType, GeneratedAsset } from "@/lib/supabase/types";

const ASSET_LABEL: Record<AssetType, string> = {
  flyer_pdf: "Flyer (PDF)",
  ig_post: "Instagram post",
  ig_story: "Instagram story",
  fb_post: "Facebook post",
};

function AssetThumbnail({ asset }: { asset: GeneratedAsset }) {
  if (asset.asset_type === "flyer_pdf" || !asset.file_url) {
    return (
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded border border-black/10 text-[10px] font-medium text-gray-500 dark:border-white/15">
        PDF
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static local asset
    <img
      src={asset.file_url}
      alt=""
      className="h-14 w-14 flex-shrink-0 rounded border border-black/10 object-cover dark:border-white/15"
    />
  );
}

export default async function ListingDetailPage(
  props: PageProps<"/dashboard/listings/[id]">
) {
  const { id } = await props.params;
  const agent = await getOrCreateAgent();
  const { listing } = await getListingForAgent(id, agent.id);

  const supabase = createServiceRoleClient();
  const { data: assets, error } = await supabase
    .from("generated_assets")
    .select("*")
    .eq("listing_id", id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{listing.address}</h1>
          <p className="text-sm text-gray-500">
            {[listing.city, listing.state, listing.zip].filter(Boolean).join(", ")}
          </p>
        </div>
        <Link href="/dashboard/listings" className="text-sm text-gray-500 hover:underline">
          Back to listings
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href={`/dashboard/listings/${id}/flyer`}
          className="rounded-full border border-black/10 px-4 py-2 hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-[#1a1a1a]"
        >
          Preview flyer
        </Link>
        <Link
          href={`/dashboard/listings/${id}/ig-post`}
          className="rounded-full border border-black/10 px-4 py-2 hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-[#1a1a1a]"
        >
          Preview IG post
        </Link>
        <Link
          href={`/dashboard/listings/${id}/ig-story`}
          className="rounded-full border border-black/10 px-4 py-2 hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-[#1a1a1a]"
        >
          Preview IG story
        </Link>
      </div>

      <form action={`/api/listings/${id}/generate-assets`} method="post">
        <button
          type="submit"
          className="h-11 w-fit rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Generate assets
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Generated assets</h2>
          {assets.length > 0 && (
            <a
              href={`/api/listings/${id}/download-zip`}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Download all (.zip)
            </a>
          )}
        </div>
        {assets.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nothing generated yet — click &quot;Generate assets&quot; above.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {assets.map((asset: GeneratedAsset) => (
              <li
                key={asset.id}
                className="flex items-center gap-3 rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
              >
                <AssetThumbnail asset={asset} />
                <span className="flex-1">{ASSET_LABEL[asset.asset_type]}</span>
                {asset.file_url && (
                  <a
                    href={asset.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
