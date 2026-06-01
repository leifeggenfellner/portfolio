{
  description = "Retro — a retro-OS portfolio (Astro 5 + React 19 + Tailwind v4)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        # Pinned to match `.nvmrc` (Node 22 LTS).
        nodejs = pkgs.nodejs_22;

        # Playwright on NixOS needs the system-provided browsers because the
        # ones downloaded by `pnpm exec playwright install` are dynamically
        # linked against glibc and won't run unpatched.
        playwrightBrowsers = pkgs.playwright-driver.browsers;
      in
      {
        devShells.default = pkgs.mkShell {
          name = "retro-dev";

          packages = [
            # Toolchain. pnpm is provided by Corepack (ships with Node) so its
            # version is driven by `packageManager` in package.json. This keeps
            # CI, local, and Nix in lockstep without pinning pnpm in two places.
            nodejs
            pkgs.git
            pkgs.git-lfs

            # Native deps that Astro / Vite / sharp can shell out to
            pkgs.python3
            pkgs.pkg-config
            pkgs.vips # sharp's image backend
            pkgs.gcc
            pkgs.gnumake

            # Playwright runtime (browsers + system libs they link against)
            playwrightBrowsers

            # Nice-to-haves
            pkgs.ripgrep
            pkgs.fd
            pkgs.jq
            pkgs.nixpkgs-fmt

            # Lint / hooks tooling provided at the Nix layer so it's
            # available before `pnpm install` and on first checkout.
            pkgs.lefthook
            pkgs.actionlint
            pkgs.shellcheck
          ];

          # Make Playwright use the Nix-managed browsers and skip its downloader.
          PLAYWRIGHT_BROWSERS_PATH = "${playwrightBrowsers}";
          PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
          PLAYWRIGHT_NODEJS_PATH = "${nodejs}/bin/node";

          # Larger heap for Astro builds with many MDX pages.
          NODE_OPTIONS = "--max-old-space-size=4096";

          shellHook = ''
            # Per-user Corepack cache (writable on NixOS where /nix/store is RO).
            export COREPACK_HOME="''${XDG_CACHE_HOME:-$HOME/.cache}/corepack"
            export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

            # Activate the pnpm version pinned in package.json's `packageManager`.
            mkdir -p "$COREPACK_HOME/bin"
            corepack enable --install-directory "$COREPACK_HOME/bin" >/dev/null 2>&1 || true
            export PATH="$COREPACK_HOME/bin:$PWD/node_modules/.bin:$PATH"

            echo ""
            echo "  retro dev shell"
            echo "  ───────────────"
            echo "  node    $(node --version)"
            echo "  pnpm    $(pnpm --version 2>/dev/null || echo '(corepack will fetch on first pnpm call)')"
            echo ""
            echo "  Quick start:  pnpm install && pnpm dev"
            echo ""
          '';
        };

        # `nix fmt` formats Nix files.
        formatter = pkgs.nixpkgs-fmt;
      }
    );
}
