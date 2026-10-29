"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "./nav-link";
import { LocaleSwitcher } from "./locale-switcher";

export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("menu")}>
          <Menu className="size-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>{t("menu")}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4" aria-label={t("mainNavigation")}>
          {items.map((i) => (
            <NavLink key={i.href} href={i.href} onClick={() => setOpen(false)} className="text-base">
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 pt-4">
          <LocaleSwitcher />
        </div>
      </SheetContent>
    </Sheet>
  );
}
