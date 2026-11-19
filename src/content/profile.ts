/**
 * Who the site belongs to. About, Terminal and Contact all read from here.
 *
 * `null` marks something not supplied yet; each app leaves it out rather than
 * inventing a stand-in. Placeholder copy is flagged with `placeholder: true`
 * so it can be found and replaced.
 */

export interface ProfileLink {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  /** Terminal user name. */
  handle: string;
  role: string;
  location: string | null;
  bio: { paragraphs: string[]; placeholder: boolean };
  email: string | null;
  links: ProfileLink[];
}

export const PROFILE: Profile = {
  name: "Leif Eggenfellner",
  handle: "leif",
  role: "Full-stack engineer",
  location: null,
  bio: {
    placeholder: true,
    paragraphs: [
      "I build software at the intersection of craft and systems.",
      "This site is a working retro desktop: every window, taskbar button and terminal command is real. The full bio is on its way.",
    ],
  },
  email: null,
  links: [
    { label: "GitHub", url: "https://github.com/leifeggenfellner" },
    { label: "This site's source", url: "https://github.com/leifeggenfellner/portfolio" },
  ],
};
