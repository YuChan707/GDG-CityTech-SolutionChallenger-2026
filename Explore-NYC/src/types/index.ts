export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  time_end?: string;
  description: string;
  category: string;
  focus: string;
  is_free: boolean;
  min_price?: number;
  max_price?: number;
  group_type: string[];
  location: string;
  link: string;
  tags: string[];
  company_hosted?: string;
  experience_type?: 'event' | 'local-business';
  operating_hours?: string;
  relevanceScore?: number;
}

export interface UserPreferences {
  lookingFor: string;
  vibe: string[];
  groupType: string;
  interests: string[];
  pricePreference: string;
  customInput: string;
}

export interface FilterState {
  search: string;
  date: string;
  time: string;
}
