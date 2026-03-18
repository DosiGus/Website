import HomeTemplateDemoModal from "../../components/HomeTemplateDemoModal";

export default function DemoPage() {
  return (
    <div className="relative min-h-screen bg-[#f4efe7]">
      <HomeTemplateDemoModal defaultOpen hideTrigger closeHref="/" />
    </div>
  );
}
