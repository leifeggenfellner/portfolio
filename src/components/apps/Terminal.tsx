/**
 * Terminal — placeholder. The real app should ship a tiny
 * command parser (help, ls, cat, open, theme, crt, neofetch).
 */
export default function Terminal() {
  return (
    <pre className="p-3 font-mono text-[15px] text-[#3cff9c]" style={{ background: "#0a0618" }}>
      {`retro@os:~$ help
available: help ls cat open theme crt neofetch
retro@os:~$ █`}
    </pre>
  );
}
