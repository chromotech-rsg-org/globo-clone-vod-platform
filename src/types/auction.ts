export interface Auction {
  id: string;
  name: string;
  description?: string;
  youtube_url?: string;
  initial_bid_value: number;
  current_bid_value: number;
  bid_increment: number;
  start_date?: string;
  end_date?: string;
  registration_wait_value: number;
  registration_wait_unit: 'minutes' | 'hours' | 'days';
  status: 'active' | 'inactive';
  auction_type: 'rural' | 'judicial';
  is_live: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuctionItem {
  id: string;
  auction_id: string;
  name: string;
  description?: string;
  image_url?: string;
  initial_value: number;
  current_value: number;
  is_current: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AuctionRegistration {
  id: string;
  user_id: string;
  auction_id: string;
  status: 'approved' | 'pending' | 'rejected';
  internal_notes?: string;
  client_notes?: string;
  approved_by?: string;
  next_registration_allowed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  user_id: string;
  auction_id: string;
  auction_item_id: string;
  bid_value: number;
  status: 'approved' | 'pending' | 'rejected' | 'superseded';
  internal_notes?: string;
  client_notes?: string;
  approved_by?: string;
  is_winner: boolean;
  created_at: string;
  updated_at: string;
}

export type BidUserState = 
  | 'need_registration'
  | 'registration_pending'
  | 'registration_rejected'
  | 'can_bid'
  | 'bid_pending'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'bid_superseded';