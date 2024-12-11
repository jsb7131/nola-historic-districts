import { redirect } from "next/navigation";

// Fallback page to redirect to the historic districts map. The redirect is actually handled in next.config.ts
export default function Home() {
  redirect("/nola-historic-districts");
}
