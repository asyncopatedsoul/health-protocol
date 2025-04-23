// Tauri doesn't have a Node.js server to do proper SSR
// so we will use adapter-static to prerender the app (SSG)
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info

// /** @type {import('@sveltejs/kit').Config} */
// import adapter from "@sveltejs/adapter-static";
// export default {
// 	kit: {
// 		adapter: adapter()
// 	}
// };

import adapterStatic from "@sveltejs/adapter-static";
import adapterNode from '@sveltejs/adapter-node';

let config = {}

// detect if build target is Tauri or web
console.log('process.env',process.env)
let buildTarget = process.env.VITE_BUILD_TARGET || 'tauri'
console.log('buildTarget', buildTarget)
if (buildTarget === 'tauri') {
  // Tauri doesn't have a Node.js server to do proper SSR
  // so we will use adapter-static to prerender the app (SSG)
  config = {
    kit: {
      adapter: adapterStatic(),
    },
  }
} else {
  config = {
    kit: {
      adapter: adapterNode(),
    },
  }
}

export default config;