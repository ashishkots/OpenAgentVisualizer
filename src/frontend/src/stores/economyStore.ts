import { create } from 'zustand';
import type { ItemCategory } from '../types/economy';

type ShopCategoryFilter = ItemCategory | 'all';

interface EconomyStore {
  isWalletDropdownOpen: boolean;
  shopCategory: ShopCategoryFilter;
  toggleWalletDropdown: () => void;
  closeWalletDropdown: () => void;
  setShopCategory: (category: ShopCategoryFilter) => void;
}

export const useEconomyStore = create<EconomyStore>((set) => ({
  isWalletDropdownOpen: false,
  shopCategory: 'all',
  toggleWalletDropdown: () =>
    set((s) => ({ isWalletDropdownOpen: !s.isWalletDropdownOpen })),
  closeWalletDropdown: () => set({ isWalletDropdownOpen: false }),
  setShopCategory: (category) => set({ shopCategory: category }),
}));
