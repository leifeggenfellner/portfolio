<script lang="ts">
  import AppFrame from "@shell/AppFrame.svelte";
  import Thrower from "./Thrower.svelte";

  let { failing, onClose }: { failing: () => boolean; onClose: () => void } = $props();
</script>

<AppFrame appId="thrower" title="Thrower" {onClose}>
  <Thrower {failing} />
</AppFrame>
<p>the desktop is still here</p>
