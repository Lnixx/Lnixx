import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderById } from "@/lib/db";
import { getCategory } from "@/lib/categories";
import StarRating from "@/components/StarRating";

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = getProviderById(Number(id));
  if (!provider) notFound();

  const category = getCategory(provider.category);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href={`/category/${provider.category}`}
        className="text-sm text-brand hover:underline"
      >
        ← {category?.nameEn}
      </Link>

      <div className="mt-4 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand/10 text-4xl">
          {provider.avatarEmoji}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-50">
            {provider.name}
          </h1>
          <p className="mt-1 text-stone-600 dark:text-stone-300">{provider.tagline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <StarRating rating={provider.rating} reviewCount={provider.reviewCount} />
            <span className="text-sm text-stone-500 dark:text-stone-400">
              📍 {provider.location}
            </span>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {category?.icon} {category?.nameEn} ({category?.nameAr})
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-stone-200 p-4 text-center sm:w-auto dark:border-stone-800">
          <span className="text-2xl font-bold text-brand">
            ${provider.price}
            <span className="text-sm font-normal text-stone-400">/{category?.priceUnit}</span>
          </span>
          <Link
            href={`/book/${provider.id}`}
            className="w-full rounded-full bg-brand px-8 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Book Now
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">About</h2>
        <p className="mt-2 text-stone-700 dark:text-stone-300">{provider.bio}</p>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Portfolio</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {provider.portfolio.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`${provider.name} portfolio ${i + 1}`}
              className="h-48 w-full rounded-xl object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
