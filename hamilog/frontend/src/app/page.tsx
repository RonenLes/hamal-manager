import { redirect } from "next/navigation";

// Renders the home page component.
export default function HomePage() {
  redirect("/login");
}
