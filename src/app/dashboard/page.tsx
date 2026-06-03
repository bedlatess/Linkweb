import { redirect } from "next/navigation";

/**
 * Dashboard root — redirects to links management
 */
export default function DashboardPage() {
  redirect("/dashboard/links");
}