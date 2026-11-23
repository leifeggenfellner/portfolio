<script lang="ts">
  import "@apps/preload";
  import { APPS } from "@apps/registry";
  import { createOs, setOs } from "@lib/os/context";
  import type { InitialWindow } from "@lib/os/context";
  import Desktop from "./Desktop.svelte";

  interface Props {
    /** The window an app route opens with; none on `/`. */
    initial?: InitialWindow;
  }

  let { initial }: Props = $props();

  // The island root: one kernel per mount, shared with the shell and every app below.
  // svelte-ignore state_referenced_locally
  const os = setOs(createOs(APPS, initial));

  $effect(() => os.viewport.listen());
  $effect(() => os.keymap.listen());
</script>

<Desktop deepLink={Boolean(initial)} />
