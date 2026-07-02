"use client";
import { ForgotPasswordForm } from "./forgetpasswordForm";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative">
      {/* Back Icon at top left */}
      <button
        type="button"
        aria-label="Go back"
        onClick={() => router.back()}
        className="absolute top-6 left-6 md:top-10 md:left-10 rounded-full p-2 bg-white/80 dark:bg-neutral-900/80 shadow hover:bg-white dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-800"
        style={{ zIndex: 10 }}
      >
        <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
      </button>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
