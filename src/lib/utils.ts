import { formatDistanceToNow, parseISO, format } from 'date-fns';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(points);
}

export function formatPercent(percent: number, showSign = true): string {
  const sign = showSign && percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function formatDate(dateString: string, formatPattern = 'dd MMM yyyy, hh:mm a'): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return `Today, ${format(date, 'hh:mm a')}`;
    }

    return format(date, formatPattern);
  } catch {
    return dateString;
  }
}

export function truncate(text: string, length = 140): string {
  if (!text || text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getSentimentBadge(sentiment: string | null | undefined): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (sentiment) {
    case 'positive':
      return {
        label: 'Bullish',
        bg: 'rgba(16, 185, 129, 0.12)',
        text: '#10b981',
        border: 'rgba(16, 185, 129, 0.25)',
      };
    case 'negative':
      return {
        label: 'Bearish',
        bg: 'rgba(239, 68, 68, 0.12)',
        text: '#ef4444',
        border: 'rgba(239, 68, 68, 0.25)',
      };
    default:
      return {
        label: 'Neutral',
        bg: 'rgba(148, 163, 184, 0.12)',
        text: '#94a3b8',
        border: 'rgba(148, 163, 184, 0.25)',
      };
  }
}
