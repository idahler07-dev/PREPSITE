"use server";

import { getLocale } from "next-intl/server";
import { signOut } from "@/lib/auth";

export async function signOutAction() {
  const locale = await getLocale();
  await signOut({ redirectTo: `/${locale}` });
}
