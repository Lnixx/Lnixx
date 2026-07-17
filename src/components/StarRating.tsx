export default function StarRating({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  return (
    <div className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-300">
      <span className="text-accent">★</span>
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="text-stone-400">({reviewCount})</span>
    </div>
  );
}
