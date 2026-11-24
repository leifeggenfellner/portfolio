<script lang="ts">
  import type { AppProps } from "@lib/app-shell";
  import { getOs } from "@lib/os/context";
  import { SETTINGS_SCHEMA } from "@lib/settings";
  import type { SettingKey, SettingSpec, SettingsGroup } from "@lib/settings";
  import RetroButton from "@primitives/RetroButton.svelte";

  // Settings needs nothing from the shell.
  let { shell: _shell }: AppProps = $props();

  const { settings } = getOs();

  const GROUPS: SettingsGroup[] = ["Startup", "Appearance", "Desktop"];
  const ENTRIES = Object.entries(SETTINGS_SCHEMA) as [SettingKey, SettingSpec][];

  // Every value offered comes from that key's own schema entry, so it fits;
  // iterating the schema loses the key-to-value pairing TypeScript would need.
  function update(key: SettingKey, value: string | boolean) {
    settings.set(key, value as never);
  }

  const CONTROL_LABEL_CLASS =
    "focus-ring has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-text has-[:focus-visible]:outline-offset-1 flex cursor-pointer items-center gap-2 rounded-sm p-1";
  const FIELDSET_CLASS = "border-bevel-shadow flex flex-col gap-2 border p-3";
  const SETTING_TITLE_CLASS = "text-13 font-semibold";
</script>

<div class="text-text flex h-full flex-col gap-3 overflow-y-auto p-4">
  {#each GROUPS as group (group)}
    <fieldset class={FIELDSET_CLASS}>
      <legend class="px-1 font-semibold">{group}</legend>
      {#each ENTRIES.filter(([, spec]) => spec.group === group) as [key, spec] (key)}
        {#if spec.kind === "toggle"}
          <label class={CONTROL_LABEL_CLASS}>
            <input
              class="accent-accent"
              type="checkbox"
              checked={settings.current[key] === true}
              onchange={(event) => update(key, event.currentTarget.checked)}
            />
            <span>{spec.label}</span>
          </label>
        {:else if spec.checkbox}
          {@const [on, off] = spec.options}
          <label class={CONTROL_LABEL_CLASS}>
            <input
              class="accent-accent"
              type="checkbox"
              checked={settings.current[key] === on?.[0]}
              onchange={(event) => update(key, (event.currentTarget.checked ? on?.[0] : off?.[0]) ?? spec.default)}
            />
            <span>{spec.label}</span>
          </label>
        {:else}
          <!-- Named group, so a screen reader says "CRT effect" before "Off". -->
          <div class="flex flex-col gap-2" role="radiogroup" aria-labelledby="settings-{key}-title">
            <span id="settings-{key}-title" class={SETTING_TITLE_CLASS}>{spec.label}</span>
            {#each spec.options as [value, label] (value)}
              <label class={CONTROL_LABEL_CLASS}>
                <input
                  class="accent-accent"
                  type="radio"
                  name="settings-{key}"
                  {value}
                  checked={settings.current[key] === value}
                  onchange={() => update(key, value)}
                />
                <span>{label}</span>
              </label>
            {/each}
          </div>
        {/if}
      {/each}
    </fieldset>
  {/each}

  <RetroButton variant="default" onclick={() => settings.reset()}>Reset to defaults</RetroButton>
</div>
