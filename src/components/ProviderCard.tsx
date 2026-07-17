import Link from "next/link";
import type { Provider } from "@/lib/db";
import { getCategory } from "@/lib/categories";
import StarRating from "./StarRating";

export default function ProviderCard({ provider }: { provider: Provider }) {
  const category = getCategory(provider.category);
  return (
    <Link
      href={`/provider/${provider.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-shadow hover:shadow-lg dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="relative h-36 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={provider.portfolio[0]}
          alt={`${provider.name} work sample`}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-stone-700 dark:bg-stone-900/90 dark:text-stone-200">
          {category?.icon} {category?.nameEn}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{provider.avatarEmoji}</span>
          <h3 className="font-semibold text-stone-900 dark:text-stone-50">{provider.name}</h3>
        </div>
        <p className="line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
          {provider.tagline}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <StarRating rating={provider.rating} reviewCount={provider.reviewCount} />
          <span className="font-semibold text-brand">
            ${provider.price}
            <span className="text-xs font-normal text-stone-400">/{category?.priceUnit}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
