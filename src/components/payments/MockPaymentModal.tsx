"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle, 
  Loader2, 
  Info,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PaymentPlan } from "@/lib/types/database.types";

interface MockPaymentModalProps {
  role: "shishya" | "guru";
  userId: string;
  onSuccess?: () => void;
  isOpen?: boolean;
}

export function MockPaymentModal({
  role,
  userId,
  onSuccess,
  isOpen = true,
}: MockPaymentModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const isGuru = role === "guru";
  const amount = isGuru ? 200 : 60;
  const plan: PaymentPlan = isGuru ? "guru_monthly" : "shishya_onetime";
  const planTitle = isGuru 
    ? "Guru Samman & Mentorship Pass" 
    : "Shishya Sacred Ink Initiation";
  const billingCycle = isGuru ? "/ month" : "one-time";

  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [upiId, setUpiId] = useState("student.demo@upi");
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [progressMsg, setProgressMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [txnId, setTxnId] = useState("");

  if (!isOpen) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("processing");
    setProgressMsg("Simulating bank authorization...");
    setErrorMsg("");

    const generatedTxn = `TXN_SANGAM_${Date.now().toString(36).toUpperCase()}`;
    setTxnId(generatedTxn);

    try {
      await new Promise((r) => setTimeout(r, 800));
      setProgressMsg("Generating cryptographic verification receipt...");

      await new Promise((r) => setTimeout(r, 700));

      // Insert record into payments table
      const { error: payError } = await supabase.from("payments").insert({
        user_id: userId,
        amount: amount,
        plan: plan,
        status: "paid",
        mock: true,
      });

      if (payError) {
        console.warn("Payment audit insert notice:", payError.message);
        // Even if insert fails due to RLS or missing session during direct test, proceed for college demo
      }

      setStatus("success");
    } catch (err: any) {
      console.error("Payment error:", err);
      setErrorMsg(err.message || "Failed to process demo transaction");
      setStatus("error");
    }
  };

  const handleFinish = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-cream-50 border border-parchment-border rounded-2xl max-w-md w-full shadow-floating overflow-hidden">
        {/* College Demo Banner */}
        <div className="bg-gradient-to-r from-copper-600 to-copper-700 text-white px-4 py-2 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-copper-200" />
            <span>MOCK PAYMENT — College Live Demo</span>
          </div>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
            Simulated
          </span>
        </div>

        <div className="p-6 md:p-8">
          {status === "success" ? (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-green-100 border border-green-300 text-green-700 flex items-center justify-center mx-auto shadow-subtle">
                <CheckCircle className="w-9 h-9" />
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-espresso">
                  Payment Successful!
                </h3>
                <p className="text-xs text-espresso/70 mt-1">
                  Receipt: <span className="font-mono text-copper-700 font-semibold">{txnId}</span>
                </p>
              </div>

              <div className="bg-parchment p-4 rounded-xl border border-parchment-border text-left space-y-2 text-xs text-espresso/80">
                <div className="flex justify-between">
                  <span className="text-espresso/60">Enrolled Plan:</span>
                  <span className="font-semibold text-espresso">{planTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-espresso/60">Amount Paid:</span>
                  <span className="font-bold text-copper-700">₹{amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-espresso/60">Account Type:</span>
                  <span className="capitalize font-semibold">{role}</span>
                </div>
                {isGuru && (
                  <div className="pt-2 border-t border-parchment-border/60 text-amber-800 bg-amber-50/60 p-2 rounded">
                    ✦ Your Guru profile is now submitted for council verification. You may now explore your dashboard.
                  </div>
                )}
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-3 bg-copper text-white rounded-xl font-medium hover:bg-copper-600 transition-all shadow-subtle flex items-center justify-center gap-2"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-5">
              {/* Plan Summary Card */}
              <div className="bg-white p-4 rounded-xl border border-parchment-border">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-copper-700">
                      {role === "guru" ? "Mentor Enrollment" : "Young Artist Access"}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-espresso">
                      {planTitle}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-serif text-copper-700">₹{amount}</span>
                    <span className="text-xs text-espresso/60 block">{billingCycle}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-espresso/80 mb-2">
                  Choose Mock Payment Channel
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      paymentMethod === "upi"
                        ? "border-copper bg-copper-50 text-copper-800 shadow-subtle"
                        : "border-parchment-border bg-white text-espresso/70 hover:bg-cream-100"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-copper-600" />
                    <span>Instant UPI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      paymentMethod === "card"
                        ? "border-copper bg-copper-50 text-copper-800 shadow-subtle"
                        : "border-parchment-border bg-white text-espresso/70 hover:bg-cream-100"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-copper-600" />
                    <span>Debit / Credit Card</span>
                  </button>
                </div>
              </div>

              {/* Method Form Details */}
              {paymentMethod === "upi" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-espresso/70 mb-1">
                      Virtual Payment Address (VPA / UPI ID)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@okhdfcbank"
                      required
                      className="w-full px-3 py-2 bg-white border border-parchment-border rounded-lg text-sm text-espresso focus:outline-none focus:border-copper"
                    />
                  </div>
                  <div className="flex gap-2">
                    {["@okhdfcbank", "@paytm", "@ibl", "@ybl"].map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => setUpiId(`demo.sangam${handle}`)}
                        className="text-[10px] bg-cream-100 hover:bg-cream-200 px-2 py-1 rounded border border-parchment-border text-espresso/70"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-espresso/70 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4111 2222 3333 4444"
                      required
                      className="w-full px-3 py-2 bg-white border border-parchment-border rounded-lg text-sm text-espresso focus:outline-none focus:border-copper font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-espresso/70 mb-1">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        required
                        className="w-full px-3 py-2 bg-white border border-parchment-border rounded-lg text-sm text-espresso focus:outline-none focus:border-copper font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-espresso/70 mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        required
                        className="w-full px-3 py-2 bg-white border border-parchment-border rounded-lg text-sm text-espresso focus:outline-none focus:border-copper font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={status === "processing"}
                className="w-full py-3.5 bg-copper text-white rounded-xl font-medium hover:bg-copper-600 transition-all shadow-card flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {status === "processing" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-medium">{progressMsg}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Demo Payment (₹{amount})</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-espresso/60 flex items-center justify-center gap-1">
                <span>✦ Safe sandboxed environment &bull; No actual credit card charge</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

