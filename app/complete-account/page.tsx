import { Suspense } from "react";
import { CompleteAccountForm } from "@/components/auth/CompleteAccountForm";

export default function CompleteAccountPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-black px-4">
      <Suspense fallback={<div className="text-white/50 text-sm">Loading...</div>}>
        <CompleteAccountForm />
      </Suspense>
    </div>
  );
}
