import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PluginCard } from '../PluginCard';

const CLAUDE_PLUGIN = {
  id: 'claude-code-plugin',
  name: 'Claude Code Plugin',
  version: '1.0.0',
  status: 'active' as const,
  commands: ['/oav-status', '/oav-agents', '/oav-alerts', '/oav-cost', '/oav-replay', '/oav-debug'],
  installCommand: 'oav install claude-code-plugin',
};

const NOT_INSTALLED = {
  ...CLAUDE_PLUGIN,
  id: 'codex-plugin',
  name: 'Codex Plugin',
  status: 'not_installed' as const,
  commands: ['/oav status', '/oav agents', '/oav alerts', '/oav cost', '/oav watch'],
};

describe('PluginCard', () => {
  it('renders plugin name and version', () => {
    render(<PluginCard plugin={CLAUDE_PLUGIN} />);
    expect(screen.getByText('Claude Code Plugin')).toBeTruthy();
    expect(screen.getByText('v1.0.0')).toBeTruthy();
  });

  it('shows Active badge for active plugin', () => {
    render(<PluginCard plugin={CLAUDE_PLUGIN} />);
    expect(screen.getByText(/active/i)).toBeTruthy();
  });

  it('shows install command for not_installed plugin', () => {
    render(<PluginCard plugin={NOT_INSTALLED} />);
    expect(screen.getByText(/oav install/i)).toBeTruthy();
  });

  it('shows command list', () => {
    render(<PluginCard plugin={CLAUDE_PLUGIN} />);
    expect(screen.getByText('/oav-status')).toBeTruthy();
  });
});
