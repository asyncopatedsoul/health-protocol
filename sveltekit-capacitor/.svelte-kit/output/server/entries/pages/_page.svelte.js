import { c as create_ssr_component } from "../../chunks/ssr.js";
import "@capgo/capacitor-social-login";
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: ".svelte-1j4335o{box-sizing:border-box}h1.svelte-1j4335o{text-align:center;overflow-wrap:break-word}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<h1 class="svelte-1j4335o" data-svelte-h="svelte-w9d2nb">Welcome!</h1> <img src="/svelte_cap.png" alt="SvelteKit Capacitor" style="object-fit: scale-down; max-width: 100%; padding: 8px;" class="svelte-1j4335o"> <button class="button secondary small svelte-1j4335o" data-svelte-h="svelte-1mrhsbe">Sign in with google</button>`;
});
export {
  Page as default
};
