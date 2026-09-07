export interface InterestItem {
  id: string;
  label: string;
  emoji: string;
  tag: string;
}

export const DEFAULT_INTERESTS: InterestItem[] = [
  { id: 'food-drink', label: 'Food & Drink', emoji: '🍽️', tag: 'food-drink' },
  { id: 'events-nightlife', label: 'Events & Nightlife', emoji: '🌙', tag: 'events-nightlife' },
  { id: 'live-music-gigs', label: 'Live Music & Gigs', emoji: '🎸', tag: 'live-music-gigs' },
  { id: 'markets-shopping', label: 'Markets & Shopping', emoji: '🛍️', tag: 'markets-shopping' },
  { id: 'arts-culture', label: 'Arts & Culture', emoji: '🎨', tag: 'arts-culture' },
  { id: 'fitness-outdoors', label: 'Fitness & Outdoors', emoji: '🏃', tag: 'fitness-outdoors' },
];
