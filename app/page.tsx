import Link from 'next/link';

export default function RootPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">
          Redirecting to Dashboard...
        </h1>
        <Link href="/dashboard" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Click here to enter CRM Dashboard
        </Link>
      </div>
    </div>
  );
}
