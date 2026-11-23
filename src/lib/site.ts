/** Page titles, shared by the server layout and the client, which retitles the tab as windows change. */
export const SITE_TITLE = "RETRO//OS";
export const HOME_TITLE = `Leif Eggenfellner — ${SITE_TITLE}`;

/** A page's title: its name, then the site. */
export const pageTitle = (name: string) => `${name} · ${SITE_TITLE}`;
