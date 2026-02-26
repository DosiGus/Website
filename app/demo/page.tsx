import HomeTemplateDemoModal from "../../components/HomeTemplateDemoModal";

export default function DemoPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950">
      <HomeTemplateDemoModal defaultOpen hideTrigger closeHref="/" />
    </div>
  );
}
