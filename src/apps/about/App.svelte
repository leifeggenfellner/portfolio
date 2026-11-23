<script lang="ts">
  // Me.txt: the bio, from `@content/profile`.
  import { PROFILE } from "virtual:content/profile";
  import type { AppProps } from "@lib/app-shell";

  // Me.txt needs nothing from the shell.
  let { shell: _shell }: AppProps = $props();

  const TIMELINE = [
    { heading: "Work", entries: PROFILE.experience },
    { heading: "Education", entries: PROFILE.education },
  ];
</script>

<!-- tabindex: the bio can outgrow the window, and keyboard users need to scroll it. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<article
  class="text-text font-body retro-scroll focus-ring h-full overflow-y-auto px-5 py-4"
  aria-label="About me"
  tabindex="0"
>
  <header class="border-bevel-shadow flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b pb-3">
    <h1 class="font-chrome text-32 leading-none">{PROFILE.name}</h1>
    <p class="text-24 text-text-dim font-mono leading-none">
      {PROFILE.role}{PROFILE.location ? ` · ${PROFILE.location}` : ""}
    </p>
  </header>

  <div class="text-15 mt-4 flex max-w-[62ch] flex-col gap-3 leading-relaxed text-pretty">
    {#each PROFILE.bio.paragraphs as paragraph, i (i)}
      <p>{paragraph}</p>
    {/each}
  </div>
  {#if PROFILE.bio.placeholder}
    <p class="text-18 text-text-dim mt-3 font-mono">[draft: placeholder copy until the real bio lands]</p>
  {/if}

  {#each TIMELINE as { heading, entries } (heading)}
    <section class="mt-6 max-w-[62ch]">
      <h2 class="font-chrome text-18 border-bevel-shadow border-b pb-1">{heading}</h2>
      <ol class="mt-2 flex flex-col gap-2">
        {#each entries as entry, i (i)}
          <li class="grid grid-cols-[6.5rem_1fr] gap-x-3 max-sm:grid-cols-1">
            <span class="text-18 text-text-dim font-mono leading-snug">{entry.when}</span>
            <div class="text-14 leading-snug">
              <p><span class="font-semibold">{entry.title}</span>, {entry.org}</p>
              {#if entry.note}
                <p class="text-13 text-text-dim">{entry.note}</p>
              {/if}
            </div>
          </li>
        {/each}
      </ol>
    </section>
  {/each}

  <ul class="text-14 mt-6 flex flex-wrap gap-x-4 gap-y-1" aria-label="Links">
    {#each PROFILE.links as link (link.url)}
      <li>
        <a class="focus-ring text-link underline underline-offset-3" href={link.url} rel="me noopener" target="_blank">
          {link.label}
        </a>
      </li>
    {/each}
  </ul>
</article>
