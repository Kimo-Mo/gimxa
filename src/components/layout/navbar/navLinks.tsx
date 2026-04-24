import { Home, Gamepad2, Coins, Sparkles, Tag, Headphones, Gift } from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavLink {
  href: string;
  label: string;
  icon: ReactNode;
  description: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home', icon: <Home size={18} />, description: 'Back to homepage' },
  {
    href: '/store',
    label: 'Games',
    icon: <Gamepad2 size={18} />,
    description: 'Browse game keys',
  },
  {
    href: '/topups',
    label: 'Top-ups',
    icon: <Coins size={18} />,
    description: 'Direct in-game top-ups',
  },
  {
    href: '/store?category=gift-cards',
    label: 'Gift Cards',
    icon: <Gift size={18} />,
    description: 'Digital gift cards',
  },
  {
    href: '/store?category=software',
    label: 'Software',
    icon: <Sparkles size={18} />,
    description: 'Software keys',
  },
  {
    href: '/store?category=subscriptions',
    label: 'Subscriptions',
    icon: <Tag size={18} />,
    description: 'Subscriptions',
  },
  { href: '/support', label: 'Support', icon: <Headphones size={18} />, description: 'Help & FAQ' },
];
