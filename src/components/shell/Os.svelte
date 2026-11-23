<script lang="ts">
  import { createOs, setOs } from "@lib/os/context";
  import Desktop from "./Desktop.svelte";

  // The island root: one kernel per mount, shared with the shell and every app below.
  const os = setOs(createOs());

  $effect(() => os.viewport.listen());
  $effect(() => os.keymap.listen());
</script>

<Desktop />
