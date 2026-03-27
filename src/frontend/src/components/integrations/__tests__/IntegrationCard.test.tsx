import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IntegrationCard } from '../IntegrationCard';
import { IntegrationStatusBadge } from '../IntegrationStatusBadge';
import { CLICommandBlock } from '../CLICommandBlock';
import { OnboardingWizard } from '../../onboarding/OnboardingWizard';
import { SampleDataBanner } from '../../onboarding/SampleDataBanner';

const mockConfig = {
  id: '1', name: 'Test Integration', type: 'sdk' as const,
  status: 'connected' as const, last_event_at: null,
  event_count_24h: 0, install_command: 'pip install test',
};

describe('Integration + Onboarding components render without crash', () => {
  it('IntegrationCard renders', () => {
    const { container } = render(<IntegrationCard config={mockConfig} />);
    expect(container.firstChild).toBeTruthy();
  });
  it('IntegrationStatusBadge renders', () => {
    const { container } = render(<IntegrationStatusBadge status="connected" />);
    expect(container.firstChild).toBeTruthy();
  });
  it('CLICommandBlock renders', () => {
    const { container } = render(<CLICommandBlock command="pip install test" />);
    expect(container.firstChild).toBeTruthy();
  });
  it('SampleDataBanner renders null when inactive', () => {
    const { container } = render(<SampleDataBanner />);
    expect(container.firstChild).toBeNull();
  });
});
