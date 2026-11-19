/** A mailto: link with the subject and body filled in, signed with the sender's name if given. */
export function mailtoUrl(to: string, { subject, message, from }: { subject: string; message: string; from: string }) {
  const body = from.trim() ? `${message.trim()}\n\n${from.trim()}` : message.trim();
  const params = [
    subject.trim() && `subject=${encodeURIComponent(subject.trim())}`,
    body && `body=${encodeURIComponent(body)}`,
  ].filter(Boolean);
  return `mailto:${encodeURIComponent(to).replace("%40", "@")}${params.length ? `?${params.join("&")}` : ""}`;
}
