import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../canvas/WorldCanvas', () => ({ WorldCanvas: () => <div data-testid="pixijs-canvas" /> }));
vi.mock('../../hooks/useWebSocket', () => ({ useWebSocket: () => undefined }));
vi.mock('../../hooks/useWorkspace', () => ({ useWorkspace: () => ({ data: { tier: 'pro' } }) }));
vi.mock('../../stores/onboardingStore', () => ({ useOnboardingStore: vi.fn(() => ({ completed: true })) }));
vi.mock('../../components/onboarding/SampleDataBanner', () => ({ SampleDataBanner: () => null }));
vi.mock('../../components/onboarding/OnboardingWizard', () => ({ OnboardingWizard: () => <div data-testid="onboarding-wizard" /> }));

import { VirtualWorldPage } from '../VirtualWorldPage';
import { useOnboardingStore } from '../../stores/onboardingStore';

describe('VirtualWorldPage', () => {
  beforeEach(() => {
    localStorage.setItem('oav_workspace', 'test-workspace');
    // Reset to default: onboarding completed
    vi.mocked(useOnboardingStore).mockReturnValue({ completed: true } as any);
  });

  it('shows 2D mode by default', () => {
    render(<MemoryRouter><VirtualWorldPage /></MemoryRouter>);
    expect(screen.getByTestId('pixijs-canvas')).toBeTruthy();
  });

  it('shows mode toggle buttons', () => {
    render(<MemoryRouter><VirtualWorldPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /^2D$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /2\.5D/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /3D/ })).toBeTruthy();
  });

  it('switches to 2.5D mode unmounts PixiJS', () => {
    render(<MemoryRouter><VirtualWorldPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /2\.5D/ }));
    expect(screen.queryByTestId('pixijs-canvas')).toBeNull();
  });

  it('renders OnboardingWizard when onboarding not completed', () => {
    // Override mock to return completed: false for this test
    vi.mocked(useOnboardingStore).mockReturnValue({ completed: false } as any);
    render(<MemoryRouter><VirtualWorldPage /></MemoryRouter>);
    // OnboardingWizard mock returns a div with data-testid="onboarding-wizard"
    expect(screen.getByTestId('onboarding-wizard')).toBeTruthy();
  });
});
