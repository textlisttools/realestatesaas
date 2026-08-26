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
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded border border-black/10 text-[10px] font-medium text-zinc-500">
        PDF
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static local asset
    <img
      src={asset.file_url}
      alt=""
      className="h-14 w-14 flex-shrink-0 rounded border border-black/10 object-cover"
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
          <h1 className="text-brand text-2xl font-black tracking-tight">
            {listing.address}
          </h1>
          <p className="text-sm text-zinc-500">
            {[listing.city, listing.state, listing.zip].filter(Boolean).join(", ")}
          </p>
        </div>
        <Link href="/dashboard/listings" className="hover:text-brand text-sm text-zinc-500">
          Back to listings
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href={`/dashboard/listings/${id}/flyer`}
          className="border-brand text-brand rounded-full border px-4 py-2 hover:bg-black/[.04]"
        >
          Preview flyer
        </Link>
        <Link
          href={`/dashboard/listings/${id}/ig-post`}
          className="border-brand text-brand rounded-full border px-4 py-2 hover:bg-black/[.04]"
        >
          Preview IG post
        </Link>
        <Link
          href={`/dashboard/listings/${id}/ig-story`}
          className="border-brand text-brand rounded-full border px-4 py-2 hover:bg-black/[.04]"
        >
          Preview IG story
        </Link>
      </div>

      <form action={`/api/listings/${id}/generate-assets`} method="post">
        <button
          type="submit"
          className="bg-brand hover:bg-brand-dark h-11 w-fit rounded-full px-6 text-sm font-medium text-white transition-colors"
        >
          Generate assets
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-black">Generated assets</h2>
          {assets.length > 0 && (
            <a
              href={`/api/listings/${id}/download-zip`}
              className="text-gold-dark text-sm font-medium hover:underline"
            >
              Download all (.zip)
            </a>
          )}
        </div>
        {assets.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nothing generated yet — click &quot;Generate assets&quot; above.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {assets.map((asset: GeneratedAsset) => (
              <li
                key={asset.id}
                className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-3 text-sm"
              >
                <AssetThumbnail asset={asset} />
                <span className="flex-1 text-black">{ASSET_LABEL[asset.asset_type]}</span>
                {asset.file_url && (
                  <a
                    href={asset.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-dark font-medium hover:underline"
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
