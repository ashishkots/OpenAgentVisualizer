export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemCategory = 'cosmetic' | 'boost' | 'title';
export type TransactionType =
  | 'quest_reward'
  | 'achievement_reward'
  | 'login_bonus'
  | 'level_bonus'
  | 'purchase'
  | 'tournament_entry'
  | 'tournament_prize'
  | 'refund';

export interface Transaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: TransactionType;
  reference_id: string | null;
  description: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  workspace_id: string;
  balance: number;
  created_at: string;
  recent_transactions: Transaction[];
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  price: number;
  icon: string;
  rarity: ItemRarity;
  effect_data: Record<string, unknown>;
  active: boolean;
  owned: boolean;
}

export interface InventoryItem {
  id: string;
  workspace_id: string;
  item_id: string;
  agent_id: string | null;
  equipped: boolean;
  acquired_at: string;
  item: ShopItem;
}
