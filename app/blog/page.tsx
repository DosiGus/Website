import BlogClient from "../../components/BlogClient";

export const metadata = {
  title: "Wesponde Insights – Playbooks & Best Practices",
  description: "Playbooks, Benchmarks und Best Practices für Instagram-, WhatsApp- und Facebook-Messaging.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#f6f9ff]">
      <BlogClient />
    </div>
  );
}
