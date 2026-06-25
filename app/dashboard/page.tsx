// app/dashboard/page.tsx — Redirect to root dashboard
import { redirect } from "next/navigation";

export default function DashboardRedirect() {
  redirect("/");
}
