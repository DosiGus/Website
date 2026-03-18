import HomeTemplateDemoModal from "../../components/HomeTemplateDemoModal";

export default function DemoPage() {
  return (
    <div className="relative min-h-screen bg-[#f6f9ff]">
      <HomeTemplateDemoModal defaultOpen hideTrigger closeHref="/" />
    </div>
  );
}
