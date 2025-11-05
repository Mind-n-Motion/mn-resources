"use client";

import React from "react";
import { supabase } from "../lib/supabase"; // keep your relative path if not using "@/"

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-plum">
              MN Resources Finder
            </h1>
            <p className="text-sm text-slate-600">Person-centered help, one search away.</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-2">
          <a className="btn btn-ghost" href="#search">Find resources</a>
          <a className="btn btn-ghost" href="#how">How it works</a>
          <a className="btn btn-primary" href="/request">Request help</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="mt-10 md:mt-14 grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight text-brand-ink">
            Find local help for housing, food resources, mental health, and more.
          </h2>
          <p className="text-slate-600 text-lg">
            Choose a resource type, pick your county and city, and get personalized options. If you don’t see what
            you need, submit a quick request and someone from our team will follow up with additional resources.
          </p>
          <div className="flex flex-wrap gap-3">
            <a className="btn btn-primary" href="#search">Search resources</a>
            <a className="btn btn-ghost" href="/request">Request a resource</a>
          </div>
          <div className="flex items-center gap-4 pt-3">
            <Badge>Free to use</Badge>
            <Badge>MN counties</Badge>
            <Badge>Community-based</Badge>
          </div>
        </div>

        {/* Hero card: quick entry to search */}
        <div className="card p-4 md:p-6">
          <SearchPanel />
        </div>
      </section>

      {/* Features / How it works */}
      <section id="how" className="mt-16 md:mt-24">
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">How it works</h3>
        <p className="text-slate-600 mt-1">Three simple steps to support-ready results.</p>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mt-6">
          <StepCard n={1} title="Filter by need">
            Choose a category (food, housing, mental health, peer support, etc.) and set your location.
          </StepCard>
          <StepCard n={2} title="Review matches">
            We show active programs only. Click through to call, visit a site, or read details and tags.
          </StepCard>
          <StepCard n={3} title="Request help (optional)">
            Don’t see it? Send a quick request—no PHI—and we’ll look for additional fits.
          </StepCard>
        </div>
      </section>

      {/* CTA band */}
      <section id="submit" className="mt-16 md:mt-24 card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h4 className="text-xl md:text-2xl font-semibold">Can’t find what you need?</h4>
          <p className="text-slate-600">Submit a request and we’ll follow up with more options.</p>
        </div>
        <a className="btn btn-primary" href="/request">Request help</a>
      </section>

      {/* Footer */}
      <footer className="mt-16 md:mt-24 pb-6 text-sm text-slate-500">
        <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} MN Resources Finder • Built on Next.js + Supabase + Vercel by Nicole Danielle</p>
          <div className="flex items-center gap-3">
            <a className="hover:underline" href="https://vercel.com" target="_blank">Vercel</a>
            <span>•</span>
            <a className="hover:underline" href="https://supabase.com" target="_blank">Supabase</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

/** --- components (inline for now) --- */

function LogoMark() {
  return (
    <div className="h-10 w-10 rounded-2xl bg-brand-plum/90 grid place-items-center text-white">
      <span className="text-lg font-semibold">MN</span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
      {children}
    </span>
  );
}

/** Drop-in search panel that uses existing tables.
 *  You can replace this with your previous full search page later.
 */
function SearchPanel() {
  const [categories, setCategories] = React.useState<{ id: number; name: string }[]>([]);
  const [counties, setCounties] = React.useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = React.useState<{ id: number; name: string; county_id: number }[]>([]);

  const [categoryId, setCategoryId] = React.useState<string>("");
  const [countyId, setCountyId] = React.useState<string>("");
  const [cityId, setCityId] = React.useState<string>("");

  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");

  type ResourceRow = {
    id: number;
    name: string;
    description: string | null;
    phone: string | null;
    website: string | null;
    tags: string[] | null;
    status: "active" | "inactive" | "pending";
    category_id: number;
    county_id: number;
    city_id: number | null;
  };

  const [results, setResults] = React.useState<ResourceRow[]>([]);
  const [loading, setLoading] = React.useState(false);
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

  const citiesForCounty = React.useMemo(() => {
    if (!countyId) return cities;
    return cities.filter((c) => String(c.county_id) === countyId);
  }, [cities, countyId]);

  const fetchResources = React.useCallback(async function fetchResources() {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("resources")
      .select("id,name,description,phone,website,tags,status,category_id,county_id,city_id")
      .eq("status", "active");

    if (categoryId) query = query.eq("category_id", Number(categoryId));
    if (countyId)   query = query.eq("county_id", Number(countyId));
    if (cityId)     query = query.eq("city_id", Number(cityId));

    if (debouncedQ) {
      query = query.textSearch("fts", debouncedQ, { type: "websearch" });
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
      setError(error.message);
      setResults([]);
    } else {
      setResults(data ?? []);
    }
    setLoading(false);
  }, [categoryId, countyId, cityId, debouncedQ]);

  React.useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  function onKeywordKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      setDebouncedQ(q.trim());
      fetchResources();
    }
  }
  return (
    <div id="search" className="grid gap-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Field label="Resource type">
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All types</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="County">
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={countyId}
            onChange={(e) => {
              const newCountyId = e.target.value;
              setCountyId(newCountyId);
              if (newCountyId && cityId) {
                const stillValid = cities.some(
                  (ci) => String(ci.id) === cityId && String(ci.county_id) === newCountyId
                );
                if (!stillValid) setCityId("");
              }
            }}
          >
            <option value="">All counties</option>
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
            <option value="">{countyId ? "All cities in this county" : "All cities (statewide)"}</option>
            {citiesForCounty.map((ci) => (
              <option key={ci.id} value={ci.id}>{ci.name}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Keywords */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Field label="Search keywords">
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="e.g. rent help, therapy, sober housing"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeywordKeyDown}   // ← Enter triggers search
          />
        </Field>
      </div>

      {/* Keep the button as an explicit action too (optional) */}
      <button className="btn btn-primary w-full md:w-auto" onClick={fetchResources} disabled={loading}>
        {loading ? "Searching…" : "Search resources"}
      </button>

      {error && <p className="text-sm text-red-600">Error: {error}</p>}

      {/* Results */}
      <div className="mt-4 grid gap-4">
        {loading && <p className="text-slate-600">Loading results…</p>}
        {!loading && results.length === 0 && (
          <p className="text-slate-600">No matches yet. Try fewer words or different filters.</p>
        )}
        {results.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h5 className="text-lg font-semibold">{r.name}</h5>
                <p className="text-sm text-slate-600">
                  {categories.find(x => x.id === r.category_id)?.name ?? ""}
                  {" • "}
                  {counties.find(x => x.id === r.county_id)?.name ?? ""}
                  {r.city_id ? ` • ${cities.find(x => x.id === r.city_id)?.name ?? ""}` : ""}
                </p>
              </div>
              <span className="text-xs rounded-full border px-2 py-0.5">{r.status}</span>
            </div>
            {r.description && <p className="mt-2 text-slate-700">{r.description}</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {r.phone && <a className="underline" href={`tel:${r.phone}`}>{r.phone}</a>}
              {r.website && <a className="underline" href={r.website} target="_blank" rel="noreferrer">Website</a>}
              {Array.isArray(r.tags) && r.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {r.tags.map((t, i) => (
                    <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function StepCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-brand-rose/15 text-brand-plum grid place-items-center font-semibold">{n}</div>
        <h4 className="text-lg font-semibold">{title}</h4>
      </div>
      <p className="text-slate-600 mt-2">{children}</p>
    </div>
  );
}