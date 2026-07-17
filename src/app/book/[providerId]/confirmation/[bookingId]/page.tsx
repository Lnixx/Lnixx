import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingById, getProviderById } from "@/lib/db";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ providerId: string; bookingId: string }>;
}) {
  const { bookingId } = await params;
  const booking = getBookingById(Number(bookingId));
  if (!booking) notFound();

  const provider = getProviderById(booking.providerId);
  if (!provider) notFound();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-900">
        ✅
      </div>
      <h1 className="mt-4 text-2xl font-bold text-stone-900 dark:text-stone-50">
        You&apos;re booked!
      </h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">
        Confirmation sent to {booking.customerPhone}. See you soon.
      </p>

      <div className="mt-8 w-full rounded-2xl border border-stone-200 p-6 text-left dark:border-stone-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{provider.avatarEmoji}</span>
          <div>
            <p className="font-semibold text-stone-900 dark:text-stone-50">{provider.name}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">{provider.location}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <dt className="text-stone-500">Date</dt>
          <dd className="text-right font-medium text-stone-900 dark:text-stone-100">
            {booking.date}
          </dd>
          <dt className="text-stone-500">Time</dt>
          <dd className="text-right font-medium text-stone-900 dark:text-stone-100">
            {booking.time}
          </dd>
          <dt className="text-stone-500">Booked for</dt>
          <dd className="text-right font-medium text-stone-900 dark:text-stone-100">
            {booking.customerName}
          </dd>
          <dt className="text-stone-500">Status</dt>
          <dd className="text-right font-medium capitalize text-green-600">{booking.status}</dd>
        </dl>
      </div>

      <Link
        href="/"
        className="mt-8 rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
      >
        Back to home
      </Link>
    </div>
  );
}
