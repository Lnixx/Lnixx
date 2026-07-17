import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderById } from "@/lib/db";
import { getCategory } from "@/lib/categories";
import BookingForm from "@/components/BookingForm";

export default async function BookPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const provider = getProviderById(Number(providerId));
  if (!provider) notFound();

  const category = getCategory(provider.category);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href={`/provider/${provider.id}`} className="text-sm text-brand hover:underline">
        ← Back to {provider.name}
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-3xl">{provider.avatarEmoji}</span>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
            Book {provider.name}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {category?.nameEn} · ${provider.price}/{category?.priceUnit}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-stone-200 p-6 dark:border-stone-800">
        <BookingForm
          providerId={provider.id}
          price={provider.price}
          priceUnit={category?.priceUnit ?? "job"}
        />
      </div>
    </div>
  );
}
