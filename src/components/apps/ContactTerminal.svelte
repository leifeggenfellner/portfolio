<script lang="ts">
  import { PROFILE } from "@content/profile";
  import type { AppProps } from "@lib/app-shell";
  import { mailtoUrl } from "@lib/mailto";
  import RetroButton from "@primitives/RetroButton.svelte";

  // Contact needs nothing from the shell.
  let { shell: _shell }: AppProps = $props();

  const MIN_MESSAGE = 10;

  let from = $state("");
  let subject = $state("");
  let message = $state("");
  let error = $state<string | null>(null);
  let sent = $state(false);
  let copied = $state(false);
  let messageEl = $state<HTMLTextAreaElement>();

  function send(e: SubmitEvent) {
    e.preventDefault();
    if (!PROFILE.email) return;
    if (message.trim().length < MIN_MESSAGE) {
      error = message.trim() ? "Say a little more: at least 10 characters." : "Write a message first.";
      messageEl?.focus();
      return;
    }
    error = null;
    window.location.href = mailtoUrl(PROFILE.email, { subject, message, from });
    sent = true;
  }

  async function copyAddress() {
    if (!PROFILE.email) return;
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      copied = true;
      window.setTimeout(() => (copied = false), 2000);
    } catch {
      // Clipboard access can be refused; the address stays visible to copy by hand.
    }
  }

  const FIELD_CLASS =
    "bevel-in-thin bg-surface-3 text-text text-14 focus-ring w-full px-2 py-1.5 placeholder:text-text-dim";
  const LABEL_CLASS = "text-13 font-semibold";
</script>

<div class="text-text flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4">
  {#if PROFILE.email}
    <form class="flex flex-1 flex-col gap-3" novalidate onsubmit={send}>
      <div class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
        <span class={LABEL_CLASS}>To</span>
        <div class="flex items-center gap-2">
          <span class="bevel-in-thin bg-surface-2 text-18 min-w-0 flex-1 truncate px-2 py-1 font-mono leading-tight">
            {PROFILE.email}
          </span>
          <RetroButton size="sm" onclick={copyAddress}>{copied ? "Copied" : "Copy"}</RetroButton>
        </div>
        <label for="contact-from" class={LABEL_CLASS}>From</label>
        <input id="contact-from" class={FIELD_CLASS} bind:value={from} placeholder="Your name (optional)" />
        <label for="contact-subject" class={LABEL_CLASS}>Subject</label>
        <input id="contact-subject" class={FIELD_CLASS} bind:value={subject} placeholder="Hello from your desktop" />
      </div>
      <label for="contact-message" class="sr-only">Message</label>
      <textarea
        bind:this={messageEl}
        id="contact-message"
        class={[FIELD_CLASS, "min-h-28 flex-1 resize-none leading-relaxed"]}
        bind:value={message}
        placeholder="Message"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? "contact-error" : undefined}
      ></textarea>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-13 text-text-dim" aria-live="polite">
          {#if error}
            <span id="contact-error" class="text-err">{error}</span>
          {:else if sent}
            Handed to your mail app. Nothing opened? Copy the address instead.
          {:else}
            Opens your own mail app; nothing is sent from this page.
          {/if}
        </p>
        <RetroButton type="submit" variant="primary">Send</RetroButton>
      </div>
    </form>
  {:else}
    <p class="text-14">The mail address isn't published yet. Until then, find me here:</p>
  {/if}

  <nav aria-label="Elsewhere" class="border-bevel-shadow flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2">
    {#each PROFILE.links as link (link.url)}
      <a
        class="focus-ring text-link text-14 underline underline-offset-3"
        href={link.url}
        rel="me noopener"
        target="_blank">{link.label}</a
      >
    {/each}
  </nav>
</div>
