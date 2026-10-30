"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Keyboard, Maximize, Minimize, Minus, Plus, ScanLine, Sigma, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FULLSCREEN_KEY = "F";

export interface ToolbarProps {
  isMath: boolean;
  calcOpen: boolean;
  onCalculator: () => void;
  onReference: () => void;
  lineReader: boolean;
  onLineReader: () => void;
  fullscreen: boolean;
  onFullscreen: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoom: (dir: 1 | -1) => void;
  onShortcuts: () => void;
}

/** The "on" dot for toggles in the phone menu. */
const On = () => <span className="ms-auto size-2 rounded-full bg-primary" aria-hidden />;

/** One toolbar icon with a hover/focus label that names its shortcut key. */
function Tool({ label, keys, pressed, disabled, onClick, children }: { label: string; keys?: string; pressed?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={pressed ? "secondary" : "ghost"} size="icon" onClick={onClick} disabled={disabled} aria-pressed={pressed} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        {label}
        {keys && <kbd className="rounded border border-background/30 px-1 font-mono text-[10px]">{keys}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

/** Test tools: icons with labels on tablets and up, a single "Tools" menu on phones. */
export function TestToolbar(p: ToolbarProps) {
  const t = useTranslations("test");
  const fsLabel = p.fullscreen ? t("tools.exitFullscreen") : t("tools.fullscreen");
  return (
    <>
      <div className="hidden items-center gap-0.5 md:flex">
        {p.isMath && (
          <>
            <Tool label={t("tools.calculator")} keys="C" pressed={p.calcOpen} onClick={p.onCalculator}>
              <Calculator aria-hidden />
            </Tool>
            <Tool label={t("tools.reference")} keys="R" onClick={p.onReference}>
              <Sigma aria-hidden />
            </Tool>
          </>
        )}
        <Tool label={t("tools.lineReader")} keys="L" pressed={p.lineReader} onClick={p.onLineReader}>
          <ScanLine aria-hidden />
        </Tool>
        <Tool label={t("tools.zoomOut")} disabled={!p.canZoomOut} onClick={() => p.onZoom(-1)}>
          <Minus aria-hidden />
        </Tool>
        <Tool label={t("tools.zoomIn")} disabled={!p.canZoomIn} onClick={() => p.onZoom(1)}>
          <Plus aria-hidden />
        </Tool>
        <Tool label={fsLabel} keys={FULLSCREEN_KEY} pressed={p.fullscreen} onClick={p.onFullscreen}>
          {p.fullscreen ? <Minimize aria-hidden /> : <Maximize aria-hidden />}
        </Tool>
        <Tool label={t("tools.shortcuts")} keys="?" onClick={p.onShortcuts}>
          <Keyboard aria-hidden />
        </Tool>
      </div>

      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Wrench aria-hidden />
              {t("tools.menu")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {p.isMath && (
              <>
                <DropdownMenuItem onSelect={p.onCalculator} aria-checked={p.calcOpen} role="menuitemcheckbox">
                  <Calculator aria-hidden /> {t("tools.calculator")}
                  {p.calcOpen && <On />}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={p.onReference}>
                  <Sigma aria-hidden /> {t("tools.reference")}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onSelect={p.onLineReader} aria-checked={p.lineReader} role="menuitemcheckbox">
              <ScanLine aria-hidden /> {t("tools.lineReader")}
              {p.lineReader && <On />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!p.canZoomIn} onSelect={(e) => (e.preventDefault(), p.onZoom(1))}>
              <Plus aria-hidden /> {t("tools.zoomIn")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!p.canZoomOut} onSelect={(e) => (e.preventDefault(), p.onZoom(-1))}>
              <Minus aria-hidden /> {t("tools.zoomOut")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={p.onFullscreen}>
              {p.fullscreen ? <Minimize aria-hidden /> : <Maximize aria-hidden />} {fsLabel}
              <DropdownMenuShortcut>{FULLSCREEN_KEY}</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
