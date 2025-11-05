"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminSubmissions() {
  const router = useRouter();
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      // 1) must be logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?returnTo=${encodeURIComponent("/admin/submissions")}`);
        return;
      }

      // 2) must be an admin (thanks to admins RLS policy above)
      const { data: adminRow, error: adminErr } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminErr) { setErr(adminErr.message); setLoading(false); return; }
      if (!adminRow) { router.replace("/"); return; } // not an admin

      // 3) ok, load pending submissions
      const { data, error } = await supabase
        .from("submissions")
        .select("id, requester_name, contact, status, created_at, details")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) setErr(error.message);
      setRows((data ?? []).map(r => ({
        ...r,
        details: typeof r.details === "string" ? JSON.parse(r.details) : r.details
      })));
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <main className="mx-auto max-w-5xl px-4 py-10">Loading…</main>;
  if (err) return <main className="mx-auto max-w-5xl px-4 py-10 text-red-600">Error: {err}</main>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Pending submissions</h1>
      <div className="mt-6 grid gap-4">
        {rows.length === 0 && <p className="text-slate-600">No pending submissions.</p>}
        {rows.map(row => {
          const r = row.details?.resource ?? {};
          return (
            <div key={row.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{r.name ?? "(no name)"}</h3>
                  <p className="text-sm text-slate-600">{r.description ?? "—"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Suggested by {row.requester_name} • {row.contact} • {new Date(row.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost" onClick={() => reject(row.id)}>Reject</button>
                  <button className="btn btn-primary" onClick={() => approve(row.id, row.details)}>Approve → add</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );

  async function approve(id: number, d: any) {
    const r = d?.resource ?? {};
    const { error: insErr } = await supabase.from("resources").insert({
      name: r.name,
      description: r.description ?? null,
      phone: r.phone ?? null,
      website: r.website ?? null,
      tags: Array.isArray(r.tags) ? r.tags : null,
      category_id: r.category_id ?? null,
      county_id: r.county_id ?? null,
      city_id: r.city_id ?? null,
      status: "active",
    });
    if (insErr) return alert("Insert failed: " + insErr.message);

    const { error: updErr } = await supabase
      .from("submissions")
      .update({ status: "active" })
      .eq("id", id);
    if (updErr) return alert("Update failed: " + updErr.message);

    setRows(rows => rows.filter(x => x.id !== id));
  }

  async function reject(id: number) {
    const { error } = await supabase
      .from("submissions")
      .update({ status: "inactive" })
      .eq("id", id);
    if (error) return alert("Update failed: " + error.message);
    setRows(rows => rows.filter(x => x.id !== id));
  }
}