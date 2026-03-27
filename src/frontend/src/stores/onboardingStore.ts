import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OnboardingState, OnboardingStep } from '../types/onboarding';

interface OnboardingStore extends OnboardingState {
  advance: () => void;
  complete: () => void;
  activateSampleData: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      completed: false,
      currentStep: 1,
      sampleDataActive: false,
      advance: () =>
        set((s) => ({ currentStep: Math.min(5, s.currentStep + 1) as OnboardingStep })),
      complete: () => set({ completed: true }),
      activateSampleData: () => set({ sampleDataActive: true }),
      reset: () => set({ completed: false, currentStep: 1, sampleDataActive: false }),
    }),
    { name: 'oav-onboarding' }
  )
);
