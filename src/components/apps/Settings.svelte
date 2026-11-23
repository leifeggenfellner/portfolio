<script lang="ts">
  import { CRT_MODES, GRID_SPEEDS, ICON_SIZES, SCREENSAVER_DELAYS, THEMES } from "@lib/settings";
  import { settings } from "@lib/store/settings";
  import type { AppProps } from "@lib/app-shell";
  import RetroButton from "@primitives/RetroButton.svelte";

  // Settings needs nothing from the shell.
  let { shell: _shell }: AppProps = $props();

  const OPTION_LABELS = {
    theme: { light: "Light", dark: "Dark" },
    crt: { off: "Off", subtle: "Subtle", full: "Full" },
    gridSpeed: { paused: "Paused", slow: "Slow", normal: "Normal", fast: "Fast" },
    iconSize: { small: "Small", medium: "Medium", large: "Large" },
    screensaver: { never: "Never", "1": "After 1 minute", "3": "After 3 minutes", "10": "After 10 minutes" },
  } as const;

  const CONTROL_LABEL_CLASS =
    "focus-ring has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-text has-[:focus-visible]:outline-offset-1 flex cursor-pointer items-center gap-2 rounded-sm p-1";
  const FIELDSET_CLASS = "border-bevel-shadow flex flex-col gap-2 border p-3";
  const SETTING_TITLE_CLASS = "text-13 font-semibold";
</script>

<div class="text-text flex h-full flex-col gap-3 overflow-y-auto p-4">
  <fieldset class={FIELDSET_CLASS}>
    <legend class="px-1 font-semibold">Startup</legend>
    <label class={CONTROL_LABEL_CLASS}>
      <input
        class="accent-accent"
        type="checkbox"
        checked={$settings.bootAnimation}
        onchange={(event) => settings.set("bootAnimation", event.currentTarget.checked)}
      />
      <span>Play boot animation</span>
    </label>
  </fieldset>

  <fieldset class={FIELDSET_CLASS}>
    <legend class="px-1 font-semibold">Appearance</legend>
    <span class={SETTING_TITLE_CLASS}>Theme</span>
    {#each THEMES as theme (theme)}
      <label class={CONTROL_LABEL_CLASS}>
        <input
          class="accent-accent"
          type="radio"
          name="settings-theme"
          value={theme}
          checked={$settings.theme === theme}
          onchange={() => settings.set("theme", theme)}
        />
        <span>{OPTION_LABELS.theme[theme]}</span>
      </label>
    {/each}
    <label class={CONTROL_LABEL_CLASS}>
      <input
        class="accent-accent"
        type="checkbox"
        checked={$settings.cursors === "retro"}
        onchange={(event) => settings.set("cursors", event.currentTarget.checked ? "retro" : "system")}
      />
      <span>Pixel-art cursors</span>
    </label>
    <span class={SETTING_TITLE_CLASS}>CRT effect</span>
    {#each CRT_MODES as mode (mode)}
      <label class={CONTROL_LABEL_CLASS}>
        <input
          class="accent-accent"
          type="radio"
          name="settings-crt"
          value={mode}
          checked={$settings.crt === mode}
          onchange={() => settings.set("crt", mode)}
        />
        <span>{OPTION_LABELS.crt[mode]}</span>
      </label>
    {/each}
  </fieldset>

  <fieldset class={FIELDSET_CLASS}>
    <legend class="px-1 font-semibold">Desktop</legend>
    <span class={SETTING_TITLE_CLASS}>Grid speed</span>
    {#each GRID_SPEEDS as speed (speed)}
      <label class={CONTROL_LABEL_CLASS}>
        <input
          class="accent-accent"
          type="radio"
          name="settings-grid-speed"
          value={speed}
          checked={$settings.gridSpeed === speed}
          onchange={() => settings.set("gridSpeed", speed)}
        />
        <span>{OPTION_LABELS.gridSpeed[speed]}</span>
      </label>
    {/each}
    <span class={SETTING_TITLE_CLASS}>Icon size</span>
    {#each ICON_SIZES as size (size)}
      <label class={CONTROL_LABEL_CLASS}>
        <input
          class="accent-accent"
          type="radio"
          name="settings-icon-size"
          value={size}
          checked={$settings.iconSize === size}
          onchange={() => settings.set("iconSize", size)}
        />
        <span>{OPTION_LABELS.iconSize[size]}</span>
      </label>
    {/each}
    <span class={SETTING_TITLE_CLASS}>Screensaver</span>
    {#each SCREENSAVER_DELAYS as delay (delay)}
      <label class={CONTROL_LABEL_CLASS}>
        <input
          class="accent-accent"
          type="radio"
          name="settings-screensaver"
          value={delay}
          checked={$settings.screensaver === delay}
          onchange={() => settings.set("screensaver", delay)}
        />
        <span>{OPTION_LABELS.screensaver[delay]}</span>
      </label>
    {/each}
  </fieldset>

  <RetroButton variant="default" onclick={() => settings.reset()}>Reset to defaults</RetroButton>
</div>
