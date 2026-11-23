<script lang="ts">
  import diskIcon from "@/assets/icons/files/disk.svg?url";
  import folderIcon from "@/assets/icons/apps/pixel/projects.svg?url";
  import { PROJECTS } from "@content/projects";
  import type { AppProps } from "@lib/app-shell";
  import { intents } from "@lib/store/intents";
  import { cx } from "@lib/cx";
  import RetroButton from "@primitives/RetroButton.svelte";

  let { shell }: AppProps = $props();

  type Folder = "root" | "projects";
  type Place = { folder: Folder } | { project: string };
  type Entry = { id: string; name: string; icon: string } & (
    | { kind: "folder"; folder: Folder }
    | { kind: "project"; slug: string }
    | { kind: "app"; appId: string }
  );

  // Desktop apps that appear as files at the root of C:.
  const ROOT_FILES: { appId: string; name: string }[] = [
    { appId: "about", name: "Me.txt" },
    { appId: "skills", name: "Skills.dat" },
    { appId: "contact", name: "Contact.exe" },
    { appId: "minigame", name: "Minesweeper.exe" },
  ];

  function entriesIn(folder: Folder): Entry[] {
    if (folder === "projects") {
      return PROJECTS.map((p) => ({
        id: `project:${p.slug}`,
        name: `${p.slug}.prj`,
        icon: diskIcon,
        kind: "project",
        slug: p.slug,
      }));
    }
    const files: Entry[] = ROOT_FILES.flatMap(({ appId, name }) => {
      const app = shell.apps.find((a) => a.id === appId);
      return app ? [{ id: `app:${appId}`, name, icon: app.icon, kind: "app" as const, appId }] : [];
    });
    return [
      { id: "folder:projects", name: "Projects", icon: folderIcon, kind: "folder", folder: "projects" },
      ...files,
    ];
  }

  let place = $state<Place>({ folder: "projects" });
  let back = $state<Place[]>([]);
  let selected = $state<string | null>(null);
  let lastPointer = "mouse";
  let content = $state<HTMLElement>();

  const project = $derived("project" in place ? PROJECTS.find((p) => p.slug === place.project) : undefined);
  const entries = $derived("folder" in place ? entriesIn(place.folder) : []);
  const address = $derived(
    "project" in place ? `C:\\Projects\\${place.project}.prj` : place.folder === "projects" ? "C:\\Projects" : "C:\\",
  );
  const parent = $derived<Place | null>(
    "project" in place ? { folder: "projects" } : place.folder === "projects" ? { folder: "root" } : null,
  );
  const status = $derived.by(() => {
    if (project) return `${project.name}, ${project.year}`;
    const entry = entries.find((e) => e.id === selected);
    return entry ? entry.name : `${entries.length} object${entries.length === 1 ? "" : "s"}`;
  });

  function go(next: Place, remember = true) {
    if (remember) back = [...back, place];
    place = next;
    selected = null;
    content?.scrollTo({ top: 0 });
  }

  // The command palette can ask for a project; show it, opened or already open.
  $effect(() =>
    intents.subscribe(() => {
      const slug = intents.take("project");
      if (slug && PROJECTS.some((p) => p.slug === slug)) go({ project: slug });
    }),
  );

  function goBack() {
    const previous = back.at(-1);
    if (!previous) return;
    back = back.slice(0, -1);
    go(previous, false);
  }

  function open(entry: Entry) {
    if (entry.kind === "folder") go({ folder: entry.folder });
    else if (entry.kind === "project") go({ project: entry.slug });
    else shell.open(entry.appId);
  }

  // As on the desktop: click selects, double-click opens, and keyboard or touch open at once.
  function handleClick(entry: Entry, e: MouseEvent) {
    if (e.detail === 0 || lastPointer === "touch") open(entry);
    else selected = entry.id;
  }

  const ENTRY_CLASS =
    "focus-ring no-select text-12 flex w-22 flex-col items-center gap-1 border border-dotted border-transparent px-0.5 py-1.5 text-center leading-tight break-words";
  const TREE_CLASS = "focus-ring no-select text-13 flex w-full items-center gap-1.5 px-1 py-0.5 text-left";
  const LINK_BUTTON = "bevel-out focus-ring bg-surface text-14 inline-flex min-h-7 items-center px-4 font-semibold";
  const BASE = import.meta.env.BASE_URL;
</script>

<div class="text-text flex h-full min-h-0 flex-col">
  <div class="border-bevel-shadow flex items-center gap-1.5 border-b px-1.5 py-1">
    <RetroButton size="sm" disabled={!back.length} onclick={goBack}>Back</RetroButton>
    <RetroButton size="sm" disabled={!parent} onclick={() => parent && go(parent)} aria-label="Up one level"
      >Up</RetroButton
    >
    <span class="bevel-in-thin bg-surface-3 text-16 min-w-0 flex-1 truncate px-2 py-0.5 font-mono" aria-label="Address"
      >{address}</span
    >
  </div>

  <div class="grid min-h-0 flex-1 grid-cols-[9rem_1fr] max-md:grid-cols-1">
    <nav aria-label="Folders" class="bevel-in bg-surface-3 retro-scroll m-0.75 mr-0 overflow-auto p-1.5 max-md:hidden">
      <button
        type="button"
        class={cx(TREE_CLASS, "folder" in place && place.folder === "root" && "bg-accent text-(--selection-text)")}
        onclick={() => go({ folder: "root" })}
        aria-current={"folder" in place && place.folder === "root" ? "page" : undefined}
      >
        <img src={folderIcon} alt="" width="16" height="16" class="pixelated" />
        C:
      </button>
      <button
        type="button"
        class={cx(
          TREE_CLASS,
          "pl-4",
          !("folder" in place && place.folder === "root") && "bg-accent text-(--selection-text)",
        )}
        onclick={() => go({ folder: "projects" })}
        aria-current={!("folder" in place && place.folder === "root") ? "page" : undefined}
      >
        <img src={folderIcon} alt="" width="16" height="16" class="pixelated" />
        Projects
      </button>
    </nav>

    <div bind:this={content} class="retro-scroll min-h-0 overflow-auto">
      {#if project}
        <article class="flex flex-col">
          <header
            class="flex items-end gap-3 bg-[linear-gradient(135deg,var(--title-active-from),var(--title-active-to))] px-4 pt-8 pb-3 text-(--title-active-text)"
          >
            <img src={diskIcon} alt="" width="48" height="48" class="pixelated" />
            <div class="min-w-0">
              <h2 class="font-chrome text-24 leading-none">{project.name}</h2>
              <p class="text-16 mt-1 font-mono">{project.year} · {project.role}</p>
            </div>
          </header>
          <div class="flex flex-col gap-3 p-4">
            <p class="text-15 font-semibold text-pretty">{project.tagline}</p>
            <p class="text-14 text-text-dim max-w-[65ch] leading-relaxed text-pretty">{project.summary}</p>
            <fieldset class="border-bevel-shadow border p-3 pt-1.5">
              <legend class="text-13 px-1 font-semibold">Stack</legend>
              <ul class="flex flex-wrap gap-1.5">
                {#each project.tech as tech (tech)}
                  <li class="bevel-out-thin bg-surface text-12 px-2 py-0.5">{tech}</li>
                {/each}
              </ul>
            </fieldset>
            <div class="flex flex-wrap gap-2">
              <a class={LINK_BUTTON} href={`${BASE}projects/${project.slug}/`}>Case study</a>
              {#if project.url}
                <a class={LINK_BUTTON} href={project.url} target="_blank" rel="noopener">Live site</a>
              {/if}
              {#if project.repo}
                <a class={LINK_BUTTON} href={project.repo} target="_blank" rel="noopener">Source</a>
              {/if}
            </div>
          </div>
        </article>
      {:else}
        <ul
          class="flex flex-wrap content-start gap-1 p-2"
          aria-label={address}
          onpointerdown={(e) => {
            lastPointer = e.pointerType;
            if (e.target === e.currentTarget) selected = null;
          }}
        >
          {#each entries as entry (entry.id)}
            {@const isSelected = selected === entry.id}
            <li>
              <button
                type="button"
                class={cx(ENTRY_CLASS, isSelected && "border-bevel-light")}
                aria-pressed={isSelected}
                onclick={(e) => handleClick(entry, e)}
                ondblclick={() => open(entry)}
              >
                <img src={entry.icon} alt="" width="32" height="32" class="pixelated" />
                <span class={cx("px-0.5", isSelected && "bg-accent text-(--selection-text)")}>{entry.name}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>

  <p class="bevel-in-thin bg-surface text-12 text-text m-0.75 mt-0 px-1.5 py-0.5" aria-live="polite">{status}</p>
</div>
