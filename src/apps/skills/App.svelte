<script lang="ts">
  // Skills Matrix: no self-ratings. Each skill names where it can be seen, so the claim can be checked.
  import { SKILL_GROUPS } from "@content/skills";
  import type { AppProps } from "@lib/app-shell";

  // Skills needs nothing from the shell.
  let { shell: _shell }: AppProps = $props();
</script>

<!-- tabindex: the list can outgrow the window, and keyboard users need to scroll it. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="text-text retro-scroll focus-ring flex h-full flex-col gap-3 overflow-y-auto p-4"
  role="region"
  aria-label="Skills"
  tabindex="0"
>
  <p class="text-14 max-w-[60ch] text-pretty">No percentages here. Each skill points to where I have used it.</p>
  {#each SKILL_GROUPS as group (group.name)}
    <table class="border-bevel-shadow text-14 w-full border">
      <caption class="text-13 bg-surface border-bevel-shadow border border-b-0 px-2 py-1 text-left font-semibold">
        {group.name}
      </caption>
      <thead class="sr-only">
        <tr>
          <th scope="col">Skill</th>
          <th scope="col">Where to see it</th>
        </tr>
      </thead>
      <tbody>
        {#each group.skills as skill (skill.name)}
          <tr class="border-bevel-shadow border-t first:border-t-0">
            <th scope="row" class="w-[45%] px-2 py-1.5 text-left align-top font-semibold">{skill.name}</th>
            <td class="text-text-dim px-2 py-1.5">{skill.evidence}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/each}
</div>
