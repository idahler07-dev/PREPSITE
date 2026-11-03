import { Bell, Check } from 'lucide-react';

/* The two icons the vendored components use, from lucide (already a dependency) instead of Hugeicons. */
export const Tick02Icon = Check;
export const Notification03Icon = Bell;

export function HugeiconsIcon({ icon: Icon, size = 24, strokeWidth = 2 }) {
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}
