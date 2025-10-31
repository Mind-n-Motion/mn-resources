"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Category = { id: number; name: string };
type County = { id: number; name: string };
type City = { id: number; name: string; county_id: number };
type Resource = {
  id: number;
  name: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  tags: string[] | null;
  category_id: number;
  county_id: number;
  city_id: number | null;
};

export default function Home() {
  // lookups
  const [categories, setCategories] = useState<Category[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // filters
  const [categoryId, setCategoryId] = useState<string>("");
  const [countyId, setCountyId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");
  const [q, setQ] = useState("");

  // results
  const [results, setResults] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);

  // modal
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // load lookups
  useEffect(() => {
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

  const citiesForCounty = useMemo(
    () => cities.filter((c) => String(c.county_id) === countyId),
    [cities, countyId]
  );

  // search
  async function search() {
    setLoading(true);
    let query: any = supabase.from("resources").select("*");
    if (categoryId) query = query.eq("category_id", Number(categoryId));
    if (countyId) query = query.eq("county_id", Number(countyId));
    if (cityId) query = query.eq("city_id", Number(cityId));
    if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{${q}}`);
    const { data, error } = await query.limit(50);
    if (!error) setResults(data || []);
    setLoading(false);
  }

  useEffect(() => {
    // auto-run search when filters change
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, countyId, cityId, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">MN Resources Finder</h1>
          <span className="text-sm text-slate-500">Demo • Supabase + Next.js (free tier)</span>
        </div>
      </header>

      {/* Filters */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Resource type</label>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All types</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">County</label>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={countyId}
              onChange={(e) => {
                setCountyId(e.target.value);
                setCityId("");
              }}
            >
              <option value="">All counties</option>
              {counties.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">City</label>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              disabled={!countyId}
            >
              <option value="">{countyId ? "All cities" : "Select a county first"}</option>
              {citiesForCounty.map((ci) => (
                <option key={ci.id} value={ci.id}>
                  {ci.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Keyword</label>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="deposit, MAT, food shelf"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {loading ? "Searching…" : `${results.length} result${results.length !== 1 ? "s" : ""}`}
          </span>
          <button
            className="ml-auto rounded-xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => setShowForm(true)}
          >
            Don’t see what you need?
          </button>
        </div>
      </section>

      {/* Results */}
      <section className="grid gap-3">
        {loading ? (
          <div className="p-8 text-center text-slate-600">Loading…</div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No results match your filters.
          </div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {results.map((r) => (
              <li key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">{r.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Category #{r.category_id} • County #{r.county_id}
                    </p>
                  </div>
                  {r.website && (
                    <a href={r.website} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm hover:underline">
                      Website
                    </a>
                  )}
                </div>
                {r.description && <p className="mt-3 text-sm leading-6 text-slate-700">{r.description}</p>}
                {r.tags && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {r.tags.map((t) => (
                      <span key={t} className="text-xs rounded-full bg-slate-100 border border-slate-200 px-2 py-1">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {r.phone && (
                  <div className="mt-4 text-sm">
                    <a href={`tel:${r.phone}`} className="hover:underline">
                      {r.phone}
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal form */}
      {showForm && (
        <MissingForm
          onClose={() => setShowForm(false)}
          onSubmitted={() => {
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 3500);
          }}
        />
      )}
      {submitted && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          Thanks! We received your request.
        </div>
      )}
    </div>
  );
}

function MissingForm({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    county_id: "",
    category_id: "",
    details: "",
  });
  const [lookups, setLookups] = useState<{ categories: Category[]; counties: County[] }>({
    categories: [],
    counties: [],
  });

  useEffect(() => {
    (async () => {
      const [{ data: cat }, { data: cou }] = await Promise.all([
        supabase.from("categories").select("id,name").order("name"),
        supabase.from("counties").select("id,name").order("name"),
      ]);
      setLookups({ categories: cat || [], counties: cou || [] });
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("submissions").insert({
      requester_name: form.name,
      contact: form.contact,
      county_id: form.county_id ? Number(form.county_id) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      details: form.details,
    });
    onSubmitted();
    onClose();
  }

  return (
    <section className="fixed inset-0 z-20 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={submit} className="relative z-10 w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl p-6 grid gap-4">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold">Don’t see the resource you need?</h2>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-slate-600 hover:bg-slate-100">
            ✕
          </button>
        </div>
        <p className="text-sm text-slate-600">Fill this out and our team will reach out with additional options. Do not include PHI.</p>

        <div className="grid md:grid-cols-2 gap-3">
          <Input label="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Best contact (email or phone)" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} required />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Select
            label="County"
            value={form.county_id}
            onChange={(v) => setForm({ ...form, county_id: v })}
            options={lookups.counties.map((c) => ({ value: String(c.id), label: c.name }))}
          />
          <Select
            label="Resource type"
            value={form.category_id}
            onChange={(v) => setForm({ ...form, category_id: v })}
            options={lookups.categories.map((c) => ({ value: String(c.id), label: c.name }))}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Tell us what you need</label>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2 min-h-[96px]"
            placeholder="Describe the need, urgency, eligibility, insurance, etc."
            required
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
          />
        </div>
        <button type="submit" className="rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700">
          Submit request
        </button>
        <p className="text-xs text-slate-500 mt-2">By submitting, you agree to be contacted. Do not include protected health information (PHI).</p>
      </form>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        className="rounded-xl border border-slate-300 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-1">
      <label className="text-sm font-medium">{label}</label>
      <select className="rounded-xl border border-slate-300 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}