import type { ListingStatus } from "@/lib/supabase/types";

export type TemplateAgent = {
  name: string | null;
  brokerage: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  headshotUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontChoice: string;
};

export type TemplateListing = {
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  status: ListingStatus;
};

export type TemplatePhotos = {
  hero: string | null;
  secondary: string[];
};

export type TemplateData = {
  agent: TemplateAgent;
  listing: TemplateListing;
  photos: TemplatePhotos;
};
