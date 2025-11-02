"use client";

import { AlertTriangle } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Access Denied
          </h1>
          <p className="mb-6 text-gray-600">
            You do not have permission to access this application. Please
            contact your administrator for access.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="rounded-lg bg-gray-900 px-4 py-2 text-white shadow-sm transition-all hover:bg-gray-800"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
