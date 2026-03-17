import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../canvas/WorldCanvas', () => ({ WorldCanvas: () => <div data-testid="pixijs-canvas" /> }));
vi.mock('../../hooks/useWebSocket', () => ({ useWebSocket: () => undefined }));
vi.mock('../../hooks/useWorkspace', () => ({ useWorkspace: () => ({ data: { tier: 'pro' } }) }));
vi.mock('../../stores/onboardingStore', () => ({ useOnboardingStore: () => ({ completed: true }) }));
vi.mock('../../components/onboarding/SampleDataBanner', () => ({ SampleDataBanner: () => null }));
vi.mock('../../components/onboarding/OnboardingWizard', () => ({ OnboardingWizard: () => null }));

import { VirtualWorldPage } from '../VirtualWorldPage';

describe('VirtualWorldPage', () => {
  beforeEach(() => {
    localStorage.setItem('oav_workspace', 'test-workspace');
  });

  it('shows 2D mode by default', () => {
    render(<MemoryRouter><VirtualWorldPage /></MemoryRouter>);
    expect(screen.getByTestId('pixijs-canvas')).toBeTruthy();
  });
  it('shows mode toggle buttons', () => {
    render(<MemoryRouter><VirtualWorldPage /></MemoryRouter>);
    expect(screen.getByText('2D')).toBeTruthy();
    expect(screen.getByText('2.5D')).toBeTruthy();
    expect(screen.getByText('3D')).toBeTruthy();
  });
  it('switches to 2.5D mode unmounts PixiJS', () => {
    render(<MemoryRouter><VirtualWorldPage /></MemoryRouter>);
    fireEvent.click(screen.getByText('2.5D'));
    expect(screen.queryByTestId('pixijs-canvas')).toBeNull();
  });
});
