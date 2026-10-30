"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { NOTIFICATION_CHANNELS, NOTIFICATION_KINDS, type NotificationPrefs } from "@/config/notifications";
import { saveNotificationPrefs } from "@/server/actions/preferences";

export function NotificationSettings({ initial, hasEmail, hasTelegram }: { initial: NotificationPrefs; hasEmail: boolean; hasTelegram: boolean }) {
  const t = useTranslations("settings.notifications");
  const [prefs, setPrefs] = useState(initial);
  const available = { email: hasEmail, telegram: hasTelegram };

  async function toggle(ch: (typeof NOTIFICATION_CHANNELS)[number], k: (typeof NOTIFICATION_KINDS)[number], value: boolean) {
    const next = { ...prefs, [ch]: { ...prefs[ch], [k]: value } };
    setPrefs(next);
    const res = await saveNotificationPrefs(next).catch(() => ({ ok: false }));
    if (!res.ok) {
      setPrefs(prefs);
      toast.error(t("error"));
    }
  }

  return (
    <div className="space-y-3">
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
                  <input
                    type="checkbox"
                    className="size-4"
                    disabled={!available[ch]}
                    checked={available[ch] && prefs[ch][k]}
                    onChange={(e) => void toggle(ch, k, e.target.checked)}
                    aria-label={`${t(`kinds.${k}.label`)} — ${t(`channels.${ch}`)}`}
                  />
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
