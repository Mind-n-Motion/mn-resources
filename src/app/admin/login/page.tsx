"use client";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function AdminLogin() {
  const [email, setEmail] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + "/admin/submissions" }});
    if (error) setErr(error.message);
    else setMsg("Check your email for the magic link.");
  }

  return (
    <main className="mx-auto max-w-sm p-6 card">
      <h1 className="text-xl font-semibold mb-4">Admin Sign In</h1>
      <form onSubmit={sendLink} className="grid gap-3">
        <input className="rounded-xl border px-3 py-2" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
        <button className="btn btn-primary" type="submit">Send magic link</button>
        {msg && <p className="text-green-700 text-sm">{msg}</p>}
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </form>
    </main>
  );
}