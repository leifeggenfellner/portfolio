<script lang="ts">
  // Fails while rendering until `failing` is false, as a crashing app would.
  let { failing }: { failing: () => boolean } = $props();

  function check(): string {
    if (failing()) throw new TypeError("cannot read properties of undefined");
    return "app is running";
  }
</script>

<p>{check()}</p>
