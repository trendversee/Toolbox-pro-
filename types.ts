export type ToolCategory =
  | 'image'
  | 'pdf'
  | 'text'
  | 'developer'
  | 'seo'
  | 'social'
  | 'calculator'
  | 'security'
  | 'converters'
  | 'ai'
  | 'color'
  | 'file';

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  hindiName?: string;
  iconName: string;
  description: string;
  color: string;
  gradient: string;
  badgeBg: string;
  badgeText: string;
}

export interface ToolItem {
  id: string;
  slug: string;
  name: string;
  category: ToolCategory;
  description: string;
  iconName: string;
  tags: string[];
  isPopular?: boolean;
  isNew?: boolean;
  seoTitle: string;
  seoDescription: string;
  howToUse: string[];
  features: string[];
  faqs: { q: string; a: string }[];
}

export interface UserHistoryItem {
  toolId: string;
  timestamp: number;
}
