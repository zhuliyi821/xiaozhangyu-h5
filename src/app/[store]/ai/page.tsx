import { redirect } from "next/navigation";

export default async function StorePage({ params }: { params: Promise<{ store: string }> }) {
  redirect("/ai");
}
