"use client";

import React from "react";
import { supabase } from "@/lib/supabase";

type Option = { id: number; name: string };
type City = { id: number; name: string; county_id: number };

export default function SuggestPage() {
  const [categories, setCategories] = React.useState<Option[]>([]);
  const [counties, setCounties] = React.useState<Option[]>([]);
  const [cities, setCities] = React.useState<City[]>([]);

  const [categoryId, setCategoryId] = React.useState("");
  const [countyId, setCountyId] = React.useState("");
  const [cityId, setCityId] = React.useState("");

  const [resourceName, setResourceName] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tags, setTags] = React.useState(""); // comma separated

  const [submitterName, setSubmitterName] = React.useState("");
  const [contact, setContact] = React.useState(""); // email or phone

  // Honeypot (hidden): if filled -> likely bot
  const [company, setCompany] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [ok, setOk] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const [{ data: cat }, { data: cou }, { data: ci }] = await Promise.all([
        supabase.from("categories").select("id,name").order("name"),
        supabase.from("counties").select("id,name").order("name"),
        supabase.from("cities").select("id,county_id,name").order("name"),
      ]);
      setCategories(cat ?? []);
      setCounties(cou ?? []);
      setCities(ci ?? []);
    })();
  }, []);

  const citiesForCounty = React.useMemo(() => {
    if (!countyId) return cities;
    return cities.filter((c) => String(c.county_id) === countyId);
  }, [cities, countyId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);

    // basic validate
    if (company) {
      setErr("Submission blocked."); // honeypot triggered
      return;
    }
    if (!resourceName.trim()) {
      setErr("Please provide the resource name.");
      return;
    }
    if (!submitterName.trim() || !contact.trim()) {
      setErr("Please include your name and a way to contact you.");
      return;
    }

    setLoading(true);

    // We'll store all suggested resource details in `submissions.details` as JSON.
    const payload = {
      kind: "resource_suggestion",
      resource: {
        name: resourceName.trim(),
        website: website.trim() || null,
        phone: phone.trim() || null,
        description: description.trim() || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        category_id: categoryId ? Number(categoryId) : null,
        county_id: countyId ? Number(countyId) : null,
        city_id: cityId ? Number(cityId) : null,
      },
      submitted_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("submissions").insert({
      requester_name: submitterName.trim(),
      contact: contact.trim(),
      category_id: categoryId ? Number(categoryId) : null,
      county_id: countyId ? Number(countyId) : null,
      details: JSON.stringify(payload),
      // status defaults to 'pending' per your schema
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setOk("Thanks! Your suggestion was submitted and is pending review.");
    // reset form
    setResourceName("");
    setWebsite("");
    setPhone("");
    setDescription("");
    setTags("");
    setCategoryId("");
    setCountyId("");
    setCityId("");
    setSubmitterName("");
    setContact("");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-plum">
        Suggest a Resource
      </h1>
      <p className="text-slate-600 mt-2">
        Share a program or service that should be listed. We’ll review it and add it if it’s a fit.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-5 card p-6">
        {/* Honeypot (hide with CSS) */}
        <div className="hidden">
          <label className="block text-sm font-medium mb-1">Company</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Do not fill this field"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Section title="Resource details">
          <Field label="Resource name *">
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              placeholder="Agency or program name"
              required
            />
          </Field>

          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Category">
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select a category (optional)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="County">
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={countyId}
                onChange={(e) => setCountyId(e.target.value)}
              >
                <option value="">Any county</option>
                {counties.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="City">
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
              >
                <option value="">{countyId ? "All cities in this county" : "Any city"}</option>
                {(countyId ? cities.filter(ci => String(ci.county_id) === countyId) : cities)
                  .map((ci) => <option key={ci.id} value={ci.id}>{ci.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Website">
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.org"
              inputMode="url"
            />
          </Field>

          <Field label="Phone">
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="555-123-4567"
              inputMode="tel"
            />
          </Field>

          <Field label="Short description">
            <textarea
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What it does, who it serves, eligibility, etc."
            />
          </Field>

          <Field label="Tags (comma-separated)">
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="rent, eviction prevention, utilities"
            />
          </Field>
        </Section>

        <Section title="Your info (for follow-up)">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Your name *">
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="Your name"
                required
              />
            </Field>
            <Field label="Contact (email or phone) *">
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="email@domain.com or 555-123-4567"
                required
              />
            </Field>
          </div>
        </Section>

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500">
            Submissions are reviewed by our team. Don’t include PHI.
          </p>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Submitting…" : "Submit suggestion"}
          </button>
        </div>

        {ok && <p className="text-green-700 text-sm">{ok}</p>}
        {err && <p className="text-red-600 text-sm">Error: {err}</p>}
      </form>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="grid gap-4">{children}</div>
    </section>
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