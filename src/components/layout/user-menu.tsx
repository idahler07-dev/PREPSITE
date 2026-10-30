"use client";

import { useTranslations } from "next-intl";
import { CreditCard, LayoutDashboard, LogOut, Settings, Shield } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/server/actions/auth";

export function UserMenu({ name, email, isOwner }: { name: string | null; email: string | null; isOwner: boolean }) {
  const t = useTranslations("nav");
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={t("account")}>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initial}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          {name && <div className="truncate font-medium">{name}</div>}
          {email && <div className="truncate text-xs text-muted-foreground">{email}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard aria-hidden /> {t("dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/billing">
            <CreditCard aria-hidden /> {t("billing")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden /> {t("settings")}
          </Link>
        </DropdownMenuItem>
        {isOwner && (
          <DropdownMenuItem asChild>
            <Link href="/manage">
              <Shield aria-hidden /> {t("manage")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut aria-hidden /> {t("signOut")}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
