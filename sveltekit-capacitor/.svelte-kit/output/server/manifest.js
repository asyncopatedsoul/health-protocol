export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","svelte_cap.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.0cbc02c7.js","app":"_app/immutable/entry/app.7166d6cc.js","imports":["_app/immutable/entry/start.0cbc02c7.js","_app/immutable/chunks/scheduler.63274e7e.js","_app/immutable/chunks/singletons.29906e01.js","_app/immutable/entry/app.7166d6cc.js","_app/immutable/chunks/preload-helper.a4192956.js","_app/immutable/chunks/scheduler.63274e7e.js","_app/immutable/chunks/index.e159bb4a.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();
