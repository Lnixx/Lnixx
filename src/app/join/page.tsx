import JoinForm from "@/components/JoinForm";

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
        Put your work online
      </h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">
        Barber, painter (دهان), plumber (سباكة), car tinting (تضليل), coach — whatever you do,
        create a free profile and start taking bookings.
      </p>

      <div className="mt-8 rounded-2xl border border-stone-200 p-6 dark:border-stone-800">
        <JoinForm />
      </div>
    </div>
  );
}
