import type { MarketQuote } from '@/types';
export default function QuoteStatus({ quote }: { quote: MarketQuote }) {
  const time = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(quote.timestamp));
  return (
    <small className="quote-status">
      {quote.status === 'stale'
        ? 'Cached quote · refresh unavailable'
        : 'Latest reported quote · may be delayed'}
      <br />
      {quote.source} · <time dateTime={quote.timestamp}>{time} IST</time>
    </small>
  );
}
