import Link from "next/link";
import { Lock } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gray-100">
          <Lock className="h-12 w-12 text-gray-700" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Unified Inbox</h1>
        <p className="mb-8 text-lg text-gray-600">
          A secure and modern inbox experience
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-gray-900 px-8 py-3 text-lg font-medium text-white shadow-sm transition-all hover:bg-gray-800 hover:shadow-md"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
