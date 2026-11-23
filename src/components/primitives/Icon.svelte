<script lang="ts">
  import { ICONS } from "@lib/icons";
  import type { IconName } from "@lib/icons";

  interface Props {
    icon: IconName;
    size?: number;
    class?: string;
  }

  let { icon, size = 16, class: className }: Props = $props();

  const data = $derived(ICONS[icon]);
</script>

<!-- Decorative: the control around it carries the name. -->
<svg
  class={className}
  width={size}
  height={size}
  viewBox="0 0 {data.width} {data.height}"
  aria-hidden="true"
  focusable="false"
>
  <!-- Trusted build-time markup from scripts/build-icons.mjs, not user content. -->
  {@html data.body}
</svg>
