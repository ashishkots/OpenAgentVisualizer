import type { Meta, StoryObj } from '@storybook/react';
import { GlassCard } from './GlassCard';

const meta: Meta<typeof GlassCard> = {
  title: 'Common/GlassCard',
  component: GlassCard,
  parameters: { backgrounds: { default: 'dark' } },
};
export default meta;
type Story = StoryObj<typeof GlassCard>;

export const Default: Story = { args: { children: 'GlassCard content here' } };
export const WithClassName: Story = { args: { children: 'Extra padding', className: 'p-8' } };
