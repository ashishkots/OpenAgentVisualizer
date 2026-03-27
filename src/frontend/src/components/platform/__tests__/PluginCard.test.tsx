import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { PluginCard } from '../PluginCard';
import type { PluginRegistry } from '../../../types/plugin';

const VERIFIED_PLUGIN: PluginRegistry = {
  id: 'reg-1',
  name: 'Slack Notifier',
  description: 'Sends agent alerts to a Slack channel.',
  version: '1.2.0',
  author: 'OAV Team',
  manifest_url: 'https://example.com/manifest.json',
  download_url: 'https://example.com/plugin.tar.gz',
  verified: true,
  downloads: 2500,
  created_at: '2026-01-01T00:00:00Z',
};

const UNVERIFIED_PLUGIN: PluginRegistry = {
  ...VERIFIED_PLUGIN,
  id: 'reg-2',
  name: 'Agent Namer',
  verified: false,
  downloads: 200,
};

describe('PluginCard', () => {
  it('renders plugin name, author, and version', () => {
    render(
      <PluginCard
        plugin={VERIFIED_PLUGIN}
        isInstalled={false}
        isInstalling={false}
        onInstall={vi.fn()}
      />,
    );
    expect(screen.getByText('Slack Notifier')).toBeTruthy();
    expect(screen.getByText('OAV Team')).toBeTruthy();
    expect(screen.getByText('v1.2.0')).toBeTruthy();
  });

  it('shows verified badge for verified plugin', () => {
    render(
      <PluginCard
        plugin={VERIFIED_PLUGIN}
        isInstalled={false}
        isInstalling={false}
        onInstall={vi.fn()}
      />,
    );
    expect(screen.getByText('Verified')).toBeTruthy();
  });

  it('does not show verified badge for unverified plugin', () => {
    render(
      <PluginCard
        plugin={UNVERIFIED_PLUGIN}
        isInstalled={false}
        isInstalling={false}
        onInstall={vi.fn()}
      />,
    );
    expect(screen.queryByText('Verified')).toBeNull();
  });

  it('shows download count', () => {
    render(
      <PluginCard
        plugin={VERIFIED_PLUGIN}
        isInstalled={false}
        isInstalling={false}
        onInstall={vi.fn()}
      />,
    );
    expect(screen.getByText('2,500')).toBeTruthy();
  });

  it('shows install button when not installed', () => {
    render(
      <PluginCard
        plugin={VERIFIED_PLUGIN}
        isInstalled={false}
        isInstalling={false}
        onInstall={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /install slack notifier/i })).toBeTruthy();
  });

  it('calls onInstall with registry id when install clicked', () => {
    const onInstall = vi.fn();
    render(
      <PluginCard
        plugin={VERIFIED_PLUGIN}
        isInstalled={false}
        isInstalling={false}
        onInstall={onInstall}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /install slack notifier/i }));
    expect(onInstall).toHaveBeenCalledWith('reg-1');
  });

  it('shows installed badge when installed', () => {
    render(
      <PluginCard
        plugin={VERIFIED_PLUGIN}
        isInstalled={true}
        isInstalling={false}
        onInstall={vi.fn()}
      />,
    );
    expect(screen.getByText('Installed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /install/i })).toBeNull();
  });

  it('disables install button when installing', () => {
    render(
      <PluginCard
        plugin={VERIFIED_PLUGIN}
        isInstalled={false}
        isInstalling={true}
        onInstall={vi.fn()}
      />,
    );
    const btn = screen.getByRole('button', { name: /install slack notifier/i });
    expect(btn.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Installing...')).toBeTruthy();
  });
});
