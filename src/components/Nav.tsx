import Link from "next/link";

export default function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand">
          <span className="text-2xl">📅</span>
          Bookly
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/"
            className="hidden text-stone-600 hover:text-brand sm:inline dark:text-stone-300"
          >
            Browse services
          </Link>
          <Link
            href="/join"
            className="rounded-full bg-brand px-4 py-2 text-white transition-colors hover:bg-brand-dark"
          >
            Become a Pro
          </Link>
        </nav>
      </div>
    </header>
  );
}
