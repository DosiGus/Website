import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";
import { fallbackTemplates } from "../../../lib/flowTemplates";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("flow_templates")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    return NextResponse.json(fallbackTemplates);
  }

  return NextResponse.json(data);
}
