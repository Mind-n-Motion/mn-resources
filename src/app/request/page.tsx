"use client";

import React from "react";
import { supabase } from "@/lib/supabase";

type Option = { id: number; name: string };
type City = { id: number; name: string; county_id: number };

export default function RequestPage() {
  const [categories, setCategories] = React.useState<Option[]>([]);
  const [counties, setCounties] = React.useState<Option[]>([]);
  const [cities, setCities] = React.useState<City[]>([]);

  const [form, setForm] = React.useState({
    requester_name: "",
    contact: "",
    category_id: "",
    county_id: "",
    city_id: "",
    details: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const [{ data: cat }, { data: cou }, { data: ci }] = await Promise.all([
        supabase.from("categories").select("id,name").order("name"),
        supabase.from("counties").select("id,name").order("name"),
        supabase.from("cities").select("id,county_id,name").order("name"),
      ]);
      setCategories(cat || []);
      setCounties(cou || []);
      setCities(ci || []);
    })();
  }, []);

  const filteredCities = React.useMemo(() => {
    if (!form.county_id) return cities; // allow choosing any city statewide if no county
    return cities.filter((c) => String(c.county_id) === form.county_id);
  }, [cities, form.county_id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // minimal validation
    if (!form.requester_name.trim() || !form.contact.trim() || !form.details.trim()) {
      setSubmitting(false);
      setError("Please fill your name, a contact method, and what you need.");
      return;
    }

    const payload = {
      requester_name: form.requester_name.trim(),
      contact: form.contact.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      county_id: form.county_id ? Number(form.county_id) : null,
      // city is optional
      city_id: form.city_id ? Number(form.city_id) : null,
      details: form.details.trim(),
      // status defaults to 'pending' via DB enum; we don't send it
    };

    const { error } = await supabase.from("submissions").insert(payload);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Thanks! We received your request and will follow up with additional resources.");
      setForm({
        requester_name: "",
        contact: "",
        category_id: "",
        county_id: "",
        city_id: "",
        details: "",
      });
    }
    setSubmitting(false);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-3xl font-semibold text-brand-ink">Request a Resource</h1>
      <p className="text-slate-600 mt-2">
        Don’t see what you need? Tell us what you’re looking for and we’ll share additional options.
        <br />Please avoid sharing protected health information (PHI).
      </p>

      <form onSubmit={handleSubmit} className="card p-5 md:p-6 mt-6 grid gap-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        <Field label="Your name *">
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={form.requester_name}
            onChange={(e) => setForm({ ...form, requester_name: e.target.value })}
            placeholder="Jane Doe"
          />
        </Field>

        <Field label="Best way to reach you (email or phone) *">
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="jane@example.com or (555) 123-4567"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Resource type (optional)">
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Any type</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="County (optional)">
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={form.county_id}
              onChange={(e) => {
                const county_id = e.target.value;
                const cityStillValid =
                  !county_id ||
                  !form.city_id ||
                  cities.some(ci => String(ci.id) === form.city_id && String(ci.county_id) === county_id);
                setForm({
                  ...form,
                  county_id,
                  city_id: cityStillValid ? form.city_id : "",
                });
              }}
            >
              <option value="">All counties</option>
              {counties.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="City (optional)">
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={form.city_id}
            onChange={(e) => setForm({ ...form, city_id: e.target.value })}
          >
            <option value="">{form.county_id ? "All cities in this county" : "All cities (statewide)"} </option>
            {filteredCities.map((ci) => (
              <option key={ci.id} value={ci.id}>{ci.name}</option>
            ))}
          </select>
        </Field>

        <Field label="What do you need? *">
          <textarea
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            rows={5}
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            placeholder="Tell us what you’re looking for. We’ll follow up with options."
          />
        </Field>

        <button className="btn btn-primary w-full md:w-auto" disabled={submitting}>
          {submitting ? "Sending…" : "Submit request"}
        </button>

        <p className="text-xs text-slate-500">
          Submissions are stored securely. Status starts as “pending”; a team member will review and respond.
        </p>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}