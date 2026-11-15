"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MockPaymentModal } from "@/components/payments/MockPaymentModal";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<"shishya" | "guru">("shishya");

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signup");
        return;
      }

      setUser(user);

      // Determine role from search param or user metadata
      const paramRole = searchParams.get("role");
      if (paramRole === "guru" || user.user_metadata?.role === "guru") {
        setRole("guru");
      } else {
        setRole("shishya");
      }

      setLoading(false);
    }

    checkAuth();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-copper animate-spin mb-2" />
        <p className="text-sm text-espresso/70 font-medium">Preparing mock payment sanctum...</p>
      </div>
    );
  }

  return (
    <MockPaymentModal
      role={role}
      userId={user?.id || ""}
      isOpen={true}
      onSuccess={() => {
        router.push("/dashboard");
        router.refresh();
      }}
    />
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-copper animate-spin mb-2" />
            <p className="text-sm text-espresso/70 font-medium">Loading mock checkout...</p>
          </div>
        }>
          <CheckoutContent />
        </Suspense>
      </main>
    </div>
  );
}
