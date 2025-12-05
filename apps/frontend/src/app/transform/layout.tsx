import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transform - FileForge",
  description: "Transform files into LLM-ready data",
};

export default function TransformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Transform page uses its own full-screen layout without the sidebar
  return <>{children}</>;
}
