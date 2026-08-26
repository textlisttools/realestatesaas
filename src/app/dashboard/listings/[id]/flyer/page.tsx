import Link from "next/link";
import { getOrCreateAgent } from "@/lib/agents";
import { getListingForAgent, toTemplateData } from "@/lib/listings";
import { FlyerTemplate } from "@/components/templates/FlyerTemplate";
import { TemplatePreview } from "@/components/templates/TemplatePreview";

export default async function FlyerPreviewPage(
  props: PageProps<"/dashboard/listings/[id]/flyer">
) {
  const { id } = await props.params;
  const agent = await getOrCreateAgent();
  const listingWithPhotos = await getListingForAgent(id, agent.id);
  const data = toTemplateData(agent, listingWithPhotos);

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-xl font-semibold">Flyer preview</h1>
        <Link href="/dashboard/listings" className="text-sm text-gray-500 hover:underline">
          Back to listings
        </Link>
      </div>
      <TemplatePreview width={2550} height={3300} scale={0.14}>
        <FlyerTemplate {...data} />
      </TemplatePreview>
    </div>
  );
}
