import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/roles";

export default async function Home() {
  const user = await requireUser();
  redirect(user.mustChangePassword ? "/account/password" : homeFor(user.role));
}
