import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { getProvidersByCategory } from "@/lib/db";
import ProviderCard from "@/components/ProviderCard";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const providers = getProvidersByCategory(slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-brand hover:underline">
        ← All services
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-4xl">{category.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
            {category.nameEn}
          </h1>
          <span className="text-stone-500 dark:text-stone-400" dir="rtl">
            {category.nameAr}
          </span>
        </div>
      </div>

      {providers.length === 0 ? (
        <p className="mt-10 text-stone-500">
          No pros in this category yet.{" "}
          <Link href="/join" className="text-brand hover:underline">
            Be the first to join!
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}
    </div>
  );
}
