import type { Route } from "./+types/home";
import { DashboardPage } from "../dashboard/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Assistant AI" },
    { name: "description", content: "Assistant juridique IA" },
  ];
}

export default function Home() {
  return <DashboardPage />;
}
