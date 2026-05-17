import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Event Check-in",
  description: "Super admin dashboard for event management",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>{children}</>
  );
}
