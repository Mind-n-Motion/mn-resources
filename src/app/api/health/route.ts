import { NextResponse } from "next/server";

export function GET() {
  const urlOK = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const keyOK = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    ok: urlOK && keyOK,
    supabaseUrlPresent: urlOK,
    anonKeyPresent: keyOK,
  });
}