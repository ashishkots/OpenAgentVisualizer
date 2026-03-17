export interface CommandPaletteItem {
  id: string;
  label: string;
  group: 'pages' | 'agents' | 'actions' | 'recent';
  icon?: string;
  action: () => void;
  keywords?: string[];
}
