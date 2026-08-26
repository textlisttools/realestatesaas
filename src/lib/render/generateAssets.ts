import { createElement } from "react";
import { launchBrowser } from "./browser";
import { renderElementToPng } from "./renderElement";
import { pngToLetterPdf } from "./pdf";
import { FlyerTemplate } from "@/components/templates/FlyerTemplate";
import { InstagramPostTemplate } from "@/components/templates/InstagramPostTemplate";
import { InstagramStoryTemplate } from "@/components/templates/InstagramStoryTemplate";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { TemplateData } from "@/components/templates/types";
import type { AssetType } from "@/lib/supabase/types";

const GENERATED_ASSETS_BUCKET = "generated-assets";
const TEMPLATE_VARIANT = "v1";

async function uploadGeneratedAsset(
  listingId: string,
  assetType: AssetType,
  ext: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const supabase = createServiceRoleClient();
  const path = `${listingId}/${assetType}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(GENERATED_ASSETS_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(GENERATED_ASSETS_BUCKET).getPublicUrl(path);

  return publicUrl;
}

export async function generateListingAssets(listingId: string, data: TemplateData) {
  const browser = await launchBrowser();
  try {
    const flyerPng = await renderElementToPng(
      browser,
      createElement(FlyerTemplate, data),
      2550,
      3300,
      data.agent.fontChoice
    );
    const flyerPdfBuffer = await pngToLetterPdf(flyerPng);
    const flyerUrl = await uploadGeneratedAsset(
      listingId,
      "flyer_pdf",
      "pdf",
      flyerPdfBuffer,
      "application/pdf"
    );

    const igPostPng = await renderElementToPng(
      browser,
      createElement(InstagramPostTemplate, data),
      1080,
      1080,
      data.agent.fontChoice
    );
    const igPostUrl = await uploadGeneratedAsset(listingId, "ig_post", "png", igPostPng, "image/png");

    const igStoryPng = await renderElementToPng(
      browser,
      createElement(InstagramStoryTemplate, data),
      1080,
      1920,
      data.agent.fontChoice
    );
    const igStoryUrl = await uploadGeneratedAsset(
      listingId,
      "ig_story",
      "png",
      igStoryPng,
      "image/png"
    );

    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("generated_assets").insert([
      { listing_id: listingId, asset_type: "flyer_pdf", file_url: flyerUrl, template_variant: TEMPLATE_VARIANT },
      { listing_id: listingId, asset_type: "ig_post", file_url: igPostUrl, template_variant: TEMPLATE_VARIANT },
      { listing_id: listingId, asset_type: "ig_story", file_url: igStoryUrl, template_variant: TEMPLATE_VARIANT },
    ]);
    if (error) throw error;
  } finally {
    await browser.close();
  }
}
