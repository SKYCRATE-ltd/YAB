/*
	YAB (Yet Another Bundler)
	Generated on 10/04/2021 @ 16:31:46
*/
(modules => {
	(function __import__(uri, mod = modules[uri]) {
		if (!mod)
			throw `MODULE NOT FOUND: ${uri}`;
		if (typeof mod === "function") {
			let m = modules[uri] = {
				exports: {},
				default: undefined,
				// TODO: relative URL management...
				import: uri => __import__(uri)
			};
			mod(m);
			return m;
		}
		return mod;
	})("./index.js");
})({
	// MODULES:
	
	"./module.js": module => {
/* 1. */	var bean = module.exports.bean = "toast";
/* 2. */	let that = module.exports.that = "that";
/* 3. */	const thing = module.exports.thing = "thing";
/* 4. */	const Woman = module.exports.Woman = class Woman {
/* 5. */	
/* 6. */	};
/* 7. */	const Wife = module.default = class Wife extends Woman {
/* 8. */	
/* 9. */	};
	},


	"./src/source.js": module => {
/* 1. */	const source = module.exports.source = "THE SOURCE, BRO";
	},


	"./src/lib/pkg.js": module => {
/* 1. */	const [
			{
				src
			}
		] = (mod => [
			{
				...mod.exports,
				src:mod.exports.source
			}
		])(module.import("./src/source.js"));
/* 4. */	
/* 5. */	module.default =  name => {
/* 6. */		return {
/* 7. */			name,
/* 8. */			src
/* 9. */		};
/* 10. */	};
	},


	"./index.js": module => {
/* 1. */	const [
			{
				Lady,
				thang
			}
		] = (mod => [
			{
				...mod.exports,
				Lady:mod.exports.Woman,
				thang:mod.exports.thing
			}
		])(module.import("./module.js"));
/* 5. */	
/* 6. */	const pkg = module.import("./src/lib/pkg.js").default;
/* 7. */	
/* 8. */	console.log(thang);
/* 9. */	console.log(pkg('porkchops!'));
	},

});
