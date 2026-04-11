/**
 * Sends the full tournament state JSON to Discord using an incoming webhook
 * (multipart file upload). If `DISCORD_BACKUP_WEBHOOK_URL` is unset, does nothing.
 */
export async function backupTournamentStateToDiscord(
  serializedState: string,
): Promise<void> {
  const url = process.env.DISCORD_BACKUP_WEBHOOK_URL?.trim();
  if (!url) return;

  const iso = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const filename = `tournament-${iso}.json`;

  const form = new FormData();
  form.append(
    "payload_json",
    JSON.stringify({
      content: `Tournament backup · ${serializedState.length} bytes`,
      attachments: [{ id: 0, filename }],
    }),
  );
  form.append(
    "files[0]",
    new Blob([serializedState], { type: "application/json" }),
    filename,
  );

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Discord webhook ${res.status}: ${text}`);
  }
}
