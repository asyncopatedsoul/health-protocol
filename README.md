# health-protocol
a cross-platform app for helping users implement physical and mental health protocols in their daily life.

# Tauri + SvelteKit

This template should help get you started developing with Tauri and SvelteKit in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).



## iOS Dev
pnpm tauri ios dev

## Android Dev
export ANDROID_HOME=/Users/michael.garrido/Library/Android/sdk
export NDK_HOME=/Users/michael.garrido/Library/Android/sdk/ndk/29.0.13113456
pnpm tauri android dev


building for Tauri desktop or mobile
https://v2.tauri.app/reference/config/

https://v2.vitejs.dev/guide/env-and-mode.html#modes
https://vite.dev/guide/env-and-mode
building for web
pnpm run build:web
node --env-file=.env.local build


vite build --mode production