import { createElement } from "react";
import { launchBrowser } from "./browser";
import { renderElementToPng } from "./renderElement";
import { framesToSlideshowMp4 } from "./video";
import { buildTikTokSlideCaptions } from "./tiktokSlides";
import { TikTokSlideTemplate } from "@/components/templates/TikTokSlideTemplate";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { TemplateData } from "@/components/templates/types";

const GENERATED_ASSETS_BUCKET = "generated-assets";
const TEMPLATE_VARIANT = "v1";
const WIDTH = 1080;
const HEIGHT = 1920;

export async function generateTikTokSlideshow(
  listingId: string,
  data: TemplateData,
  photoUrls: string[]
): Promise<void> {
  const captions = buildTikTokSlideCaptions(data, photoUrls.length);

  const browser = await launchBrowser();
  let frames: Buffer[];
  try {
    frames = [];
    for (let i = 0; i < photoUrls.length; i++) {
      const png = await renderElementToPng(
        browser,
        createElement(TikTokSlideTemplate, {
          photoUrl: photoUrls[i],
          captionTitle: captions[i].title,
          captionSubtitle: captions[i].subtitle,
          primaryColor: data.agent.primaryColor,
          logoUrl: data.agent.logoUrl,
          fontChoice: data.agent.fontChoice,
        }),
        WIDTH,
        HEIGHT,
        data.agent.fontChoice
      );
      frames.push(png);
    }
  } finally {
    await browser.close();
  }

  const mp4Buffer = await framesToSlideshowMp4(frames);

  const supabase = createServiceRoleClient();
  const path = `${listingId}/tiktok_slideshow-${Date.now()}.mp4`;

  const { error: uploadError } = await supabase.storage
    .from(GENERATED_ASSETS_BUCKET)
    .upload(path, mp4Buffer, { contentType: "video/mp4", upsert: true });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(GENERATED_ASSETS_BUCKET).getPublicUrl(path);

  const { error: insertError } = await supabase.from("generated_assets").insert({
    listing_id: listingId,
    asset_type: "tiktok_slideshow",
    file_url: publicUrl,
    template_variant: TEMPLATE_VARIANT,
  });
  if (insertError) throw insertError;
}
