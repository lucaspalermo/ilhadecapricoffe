import AppShell from "@/components/layout/AppShell";

export default function HojeLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
