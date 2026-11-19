<script lang="ts">
  import { pixelPaths } from "@lib/pixel";

  interface Props {
    /** One string per row, one character per pixel; "." is transparent. */
    rows: readonly string[];
    /** CSS colour for each character used in `rows`. */
    palette: Record<string, string>;
    /** Rendered size in px; a whole multiple of the sprite keeps pixels square. */
    size: number;
    class?: string;
  }

  let { rows, palette, size, class: className }: Props = $props();

  const width = $derived(Math.max(...rows.map((row) => row.length)));
  const paths = $derived([...pixelPaths(rows)]);
</script>

<svg
  class={className}
  viewBox={`0 0 ${width} ${rows.length}`}
  width={size}
  height={(size * rows.length) / width}
  shape-rendering="crispEdges"
  aria-hidden="true"
  focusable="false"
>
  {#each paths as [char, d] (char)}
    <path {d} fill={palette[char] ?? "currentColor"} />
  {/each}
</svg>
