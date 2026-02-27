import { NextResponse } from "next/server";
import { fallbackTemplates } from "../../../../lib/flowTemplates";

export async function GET() {
  const templates = fallbackTemplates.map((template) => ({
    id: template.id,
    slug: template.slug,
    name: template.name,
    vertical: template.vertical,
    description: template.description,
    nodes: template.nodes,
    edges: template.edges,
    triggers: template.triggers ?? [],
  }));

  return NextResponse.json(templates);
}
