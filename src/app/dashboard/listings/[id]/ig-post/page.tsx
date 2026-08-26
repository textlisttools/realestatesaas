import Link from "next/link";
import { getOrCreateAgent } from "@/lib/agents";
import { getListingForAgent, toTemplateData } from "@/lib/listings";
import { InstagramPostTemplate } from "@/components/templates/InstagramPostTemplate";
import { TemplatePreview } from "@/components/templates/TemplatePreview";

export default async function InstagramPostPreviewPage(
  props: PageProps<"/dashboard/listings/[id]/ig-post">
) {
  const { id } = await props.params;
  const agent = await getOrCreateAgent();
  const listingWithPhotos = await getListingForAgent(id, agent.id);
  const data = toTemplateData(agent, listingWithPhotos);

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-xl font-semibold">Instagram post preview</h1>
        <Link href="/dashboard/listings" className="text-sm text-gray-500 hover:underline">
          Back to listings
        </Link>
      </div>
      <TemplatePreview width={1080} height={1080} scale={0.33}>
        <InstagramPostTemplate {...data} />
      </TemplatePreview>
    </div>
  );
}
