"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { NOTIFICATION_CHANNELS, NOTIFICATION_KINDS, type NotificationPrefs } from "@/config/notifications";
import { saveNotificationPrefs } from "@/server/actions/preferences";
import BellToggle from "@/components/fx/BellToggle";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

export function NotificationSettings({ initial, hasEmail, hasTelegram }: { initial: NotificationPrefs; hasEmail: boolean; hasTelegram: boolean }) {
  const t = useTranslations("settings.notifications");
  const [prefs, setPrefs] = useState(initial);
  const available = { email: hasEmail, telegram: hasTelegram };

  const channels = NOTIFICATION_CHANNELS.filter((ch) => available[ch]);

  async function save(next: NotificationPrefs) {
    const before = prefs;
    setPrefs(next);
    const res = await saveNotificationPrefs(next).catch(() => ({ ok: false }));
    if (!res.ok) {
      setPrefs(before);
      toast.error(t("error"));
    }
  }

  const toggle = (ch: (typeof NOTIFICATION_CHANNELS)[number], k: (typeof NOTIFICATION_KINDS)[number], value: boolean) => save({ ...prefs, [ch]: { ...prefs[ch], [k]: value } });

  /** The bell: study reminders on every channel the student can receive. */
  const setStudy = (value: boolean) => save(Object.fromEntries(NOTIFICATION_CHANNELS.map((ch) => [ch, { ...prefs[ch], study: available[ch] ? value : prefs[ch].study }])) as NotificationPrefs);

  return (
    <div className="space-y-3">
      <BellToggle
        offLabel={t("bellOff")}
        onLabel={t("bellOn")}
        pressed={channels.length > 0 && channels.every((ch) => prefs[ch].study)}
        onChange={(on) => void setStudy(on)}
        disabled={channels.length === 0}
        badge={false}
        waves={false}
        size="sm"
        radius={14}
        ringDuration={480}
        crossfadeMs={160}
        color="var(--foreground)"
        background="var(--surface-2)"
        onColor="var(--primary-foreground)"
        onBackground="var(--primary)"
      />
      <table className="w-full text-sm">
        <caption className="sr-only">{t("title")}</caption>
        <thead>
          <tr className="text-start">
            <th scope="col" className="py-2 text-start font-medium">
              {t("kind")}
            </th>
            {NOTIFICATION_CHANNELS.map((ch) => (
              <th key={ch} scope="col" className="w-24 py-2 text-center font-medium">
                {t(`channels.${ch}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {NOTIFICATION_KINDS.map((k) => (
            <tr key={k}>
              <th scope="row" className="py-2 text-start font-normal">
                <span className="block">{t(`kinds.${k}.label`)}</span>
                <span className="block text-xs text-muted-foreground">{t(`kinds.${k}.help`)}</span>
              </th>
              {NOTIFICATION_CHANNELS.map((ch) => (
                <td key={ch} className="text-center">
                  <span className="flex justify-center">
                    <ToggleSwitch
                      checked={available[ch] && prefs[ch][k]}
                      onChange={(on) => void toggle(ch, k, on)}
                      disabled={!available[ch]}
                      label={`${t(`kinds.${k}.label`)} — ${t(`channels.${ch}`)}`}
                    />
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!hasTelegram && <p className="text-xs text-muted-foreground">{t("telegramHint")}</p>}
    </div>
  );
}
