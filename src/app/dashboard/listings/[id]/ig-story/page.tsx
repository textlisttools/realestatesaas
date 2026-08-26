import Link from "next/link";
import { getOrCreateAgent } from "@/lib/agents";
import { getListingForAgent, toTemplateData } from "@/lib/listings";
import { InstagramStoryTemplate } from "@/components/templates/InstagramStoryTemplate";
import { TemplatePreview } from "@/components/templates/TemplatePreview";

export default async function InstagramStoryPreviewPage(
  props: PageProps<"/dashboard/listings/[id]/ig-story">
) {
  const { id } = await props.params;
  const agent = await getOrCreateAgent();
  const listingWithPhotos = await getListingForAgent(id, agent.id);
  const data = toTemplateData(agent, listingWithPhotos);

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-brand text-xl font-black tracking-tight">Instagram story preview</h1>
        <Link href="/dashboard/listings" className="hover:text-brand text-sm text-zinc-500">
          Back to listings
        </Link>
      </div>
      <TemplatePreview width={1080} height={1920} scale={0.33}>
        <InstagramStoryTemplate {...data} />
      </TemplatePreview>
    </div>
  );
}
