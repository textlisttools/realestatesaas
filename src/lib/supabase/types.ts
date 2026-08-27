export type AssetType = "flyer_pdf" | "ig_post" | "ig_story" | "fb_post" | "tiktok_slideshow";
export type ListingStatus = "active" | "just_listed" | "pending" | "sold";
export type SubscriptionTier = "free" | "pro" | "premium";

export type Agent = {
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
  bonus_listings_remaining: number;
  retention_code_sent_at: string | null;
  created_at: string;
};

export type Listing = {
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
};

export type ListingPhoto = {
  id: string;
  listing_id: string;
  photo_url: string;
  sort_order: number;
  is_hero: boolean;
};

export type GeneratedAsset = {
  id: string;
  listing_id: string;
  asset_type: AssetType;
  file_url: string | null;
  template_variant: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: Agent;
        Insert: Partial<Agent> & { clerk_user_id: string };
        Update: Partial<Agent>;
        Relationships: [];
      };
      listings: {
        Row: Listing;
        Insert: Partial<Listing> & { address: string };
        Update: Partial<Listing>;
        Relationships: [];
      };
      listing_photos: {
        Row: ListingPhoto;
        Insert: Partial<ListingPhoto> & { photo_url: string };
        Update: Partial<ListingPhoto>;
        Relationships: [];
      };
      generated_assets: {
        Row: GeneratedAsset;
        Insert: Partial<GeneratedAsset> & { asset_type: AssetType };
        Update: Partial<GeneratedAsset>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      redeem_code: {
        Args: { p_agent_id: string; p_code: string };
        Returns: string;
      };
      consume_bonus_listing: {
        Args: { p_agent_id: string };
        Returns: boolean;
      };
    };
  };
};
