export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export interface OnboardingState {
  completed: boolean;
  currentStep: OnboardingStep;
  sampleDataActive: boolean;
}
