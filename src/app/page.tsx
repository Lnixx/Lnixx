import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getAllProviders } from "@/lib/db";
import ProviderCard from "@/components/ProviderCard";

export default function Home() {
  const providers = getAllProviders();
  const featured = providers.slice(0, 6);

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-brand/10 to-transparent px-4 py-16 text-center sm:px-6">
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl dark:text-stone-50">
          Book trusted local pros in a few taps
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600 dark:text-stone-300">
          Coaches, barbers, painters (دهان), plumbers (سباكة), car tinting (تضليل) and more —
          pick, book, pay, done.
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="mb-4 text-xl font-bold text-stone-900 dark:text-stone-50">
          Browse by service
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="font-semibold text-stone-800 dark:text-stone-100">
                {cat.nameEn}
              </span>
              <span className="text-sm text-stone-500 dark:text-stone-400" dir="rtl">
                {cat.nameAr}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="mb-4 text-xl font-bold text-stone-900 dark:text-stone-50">
          Top rated pros
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </section>

      <section className="mx-auto mb-16 w-full max-w-6xl rounded-3xl bg-brand px-6 py-10 text-center sm:px-10">
        <h2 className="text-2xl font-bold text-white">Are you a barber, painter, or coach?</h2>
        <p className="mt-2 text-brand-50 text-white/90">
          Put your work online and start getting bookings today — it's free to join.
        </p>
        <Link
          href="/join"
          className="mt-5 inline-block rounded-full bg-white px-6 py-3 font-semibold text-brand hover:bg-stone-100"
        >
          Create your profile
        </Link>
      </section>
    </div>
  );
}
