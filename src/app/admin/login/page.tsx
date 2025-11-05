"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendLink() {
    setError("");
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const redirectTo = `${base}/admin/submissions`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Login</h1>
      {sent ? (
        <p className="text-green-600">✅ Magic link sent! Check your email.</p>
      ) : (
        <>
          <input className="w-full border px-3 py-2 rounded mb-3"
                 type="email" value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="you@example.com" />
          <button onClick={sendLink} className="btn btn-primary w-full">Send login link</button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </>
      )}
    </main>
  );
}