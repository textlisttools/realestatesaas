export type AssetType = "flyer_pdf" | "ig_post" | "ig_story" | "fb_post";
export type ListingStatus = "active" | "just_listed" | "pending" | "sold";
export type SubscriptionTier = "free" | "pro";

export interface Agent {
  id: string;
  clerk_user_id: string;
  name: string | null;
  brokerage: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  headshot_url: string | null;
  brand_primary_color: string;
  brand_secondary_color: string;
  font_choice: string;
  stripe_customer_id: string | null;
  subscription_tier: SubscriptionTier;
  created_at: string;
}

export interface Listing {
  id: string;
  agent_id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  status: ListingStatus;
  description: string | null;
  mls_number: string | null;
  created_at: string;
}

export interface ListingPhoto {
  id: string;
  listing_id: string;
  photo_url: string;
  sort_order: number;
  is_hero: boolean;
}

export interface GeneratedAsset {
  id: string;
  listing_id: string;
  asset_type: AssetType;
  file_url: string | null;
  template_variant: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      agents: { Row: Agent; Insert: Partial<Agent> & { clerk_user_id: string }; Update: Partial<Agent> };
      listings: { Row: Listing; Insert: Partial<Listing> & { address: string }; Update: Partial<Listing> };
      listing_photos: { Row: ListingPhoto; Insert: Partial<ListingPhoto> & { photo_url: string }; Update: Partial<ListingPhoto> };
      generated_assets: { Row: GeneratedAsset; Insert: Partial<GeneratedAsset> & { asset_type: AssetType }; Update: Partial<GeneratedAsset> };
    };
  };
}
