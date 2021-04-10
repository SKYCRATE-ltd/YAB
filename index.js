import {
	read,
	write,
	parent_dir,
	resolve_dir
} from "computer";
import {
	Type,
	List
} from "zed";
import Program from "termite";

function pivot_dir(root, uri) {
	return uri.replace(root, '.');
}

function concat_dir(a, b) {
	return `${a}/${b}`.replace(/\/\.\//g, '/');
}

export class Module extends Type({
	path: String, // Where this module lives
	uri: String,
	source: String, // source code of the module
}) {
	static root;
	static node_modules;
	static cache = {};
	static import(uri) {
		return Module.cache[uri] = Module.cache[uri] ?? new Module(uri);
	}
	static parse_selects(selects) {
		selects = selects.split(',')
					.map(x => x.trim())
					.map(x => x.split(' as ').map(x => x.trim()));
		return [
			selects
				.map(([name, alias]) => `\n\t\t\t\t${alias || name}`)
				.join(',')
				.replace(/\t\t\t\/\*/g, '/*'),
			selects
				.filter(([name, alias]) => alias)
				.map(([name, alias]) => `\n\t\t\t\t${alias}:mod.exports.${name}`)
				.join(',')
		];
	};
	static render_bundle(modules, entry) {
		return `
(modules => {
	(function __import__(uri, mod = modules[uri]) {
		if (!mod)
			throw \`MODULE NOT FOUND: \${uri}\`;
		if (typeof mod === "function") {
			let m = modules[uri] = {
				exports: {},
				default: undefined,
				// TODO: relative URL management...
				import: uri => __import__(uri);
			};
			mod(m);
			return m;
		}
		return mod;
	})("${entry}");
})({
	/*
		YAB (Yet Another Bundler)
		Generated on ${new Date().toLocaleString().replace(', ', ' @ ')}
	*/
	${Object.values(modules).map(module => module.toString()).join('\n')}
});
`;
	}
	get imports() {
		return [
			[
				/\b(await\s+)?import\s*\(\s*"([\S^"]+)"\s*\)/g,
				(match, async, uri) => this.import(uri)
			],
			[
				/\bimport\s+"(\S+)"/g,
				(match, uri) => this.import(uri)
				// We should probably return smthg that has both this string AND the identified uri?
			],
			[
				/\bimport\s+((\S+)\s*,\s*)?\*\s+as\s+(\S+)\s+from\s+"(\S+)"/g,
				(match, match2, std = '', name, uri) =>
		`const [
			${std && `${std},\n\t\t\t`}${name}
		] = (mod => [
			${std && 'mod.default,\n\t\t\t'}mod.exports
		])(${this.import(uri)})`
		],
			[
				/\bimport\s+((\S+)\s*,\s*)?{([^}]+)}\s+from\s+"(\S+)"/g,
				(match, match2, std = '', selects, uri) => {
					const [imports, aliases] = Module.parse_selects(selects);
return `const [
			${std && `${std},\n\t\t\t`}{${imports}
			}
		] = (mod => [
			${std && 'mod.default,\n\t\t\t'}{
				...mod.exports,${aliases}
			}
		])(${this.import(uri)})`;
				}
			],
			[
				/\bimport\s+(\S+)\s+from\s+"(\S+)"/g,
				(match, std, uri) => `const ${std} = ${this.import(uri)}.default`
			]
		];
	}
	get exports() {
		return [
			[
				/\bexport\s+(var|let|const|function|class)\s+([^({\s]+)(\s+extends\s+\S+\s*)?/g,
				(match, type, name, extend = '') => {
					let end = name;
					if (type === "function" || type === "class")
						end = `${name} = ${type} ${name}${extend}`,
							type = type === "class" ? "const" : "let";
					return `${type} ${name} = module.exports.${end}`;
				}
			],
			[
				/\bexport\s+default\s+(class|function)\s+([^({\s]+)?/g,
				(match, type = '', name = '') =>
					(type && `${type === "class" ? "const" : "let"} ${name} = `) +
						`module.default = ${type}${name && ' ' + name}`
			]
		];
	}
	constructor(uri) {
		super();

		this.uri = uri;
		this.path = parent_dir(uri);
		
		// console.log('------------------------------');
		// console.log(uri);
		// console.log(this.path);

		this.source =
			this.imports.concat(this.exports)
				.reduce((src, [pattern, replacer]) =>
					src.replace(pattern, replacer),
					read(this.npm(uri) ?
						concat_dir(Module.node_modules, uri) + '/index.js' :
							concat_dir(Module.root, uri))
								.split('\n')
								.map((x, i) => `/* ${i + 1}. */\t${x}`)
								.join('\n'));
		
		Module.cache[uri] = this;
	}
	npm(path) {
		return !['.', '/'].includes(path.charAt(0));
	}
	import(path) {
		let uri = this.npm(path) ? path : concat_dir(this.path, path);
		return Module.import(uri) && `module.import("${uri}")`;
	}
	toString() {
		// Good enough for now
		return `
	"${this.uri}": module => {
${this.source.split('\n').map(line => `${line}`).join('\n')}
	},
`;
	}
}

export default Program({
	["@default"]() {
		this.pass("help");
	},
	build(
		entry_file = './index.js',
		output_file = './dist/build.js',
		node_modules = `./node_modules`,
	) {
		// We've got some debugging to do, then a site to build!
		Module.root = parent_dir(entry_file);
		Module.node_modules = node_modules;

		const MODULE = new Module(pivot_dir(Module.root, entry_file));
		console.log(Module.render_bundle(Module.cache, MODULE.uri));
		// write(output_file, render_bundle(Module.cache, MODULE.source));
	},
	watch(entry_file, output_file) {
		// use nodejs to watch changes to all the IMPORTS...
		// when a change is detected, re-run detection of IMPORTS
		// and build. Any new files will be added to watchlist and
		// any removed files will be removed from the watchlist...
		// except for stuff in the node_modules/ directory.
		// that shit will be ignored.
	},
	help(cmd) {
		// do stuff..
		if (cmd) {
			// Help for a specific cmd
		} else {
			// general help. I guess.
		}
		this.header('YAB (Yet Another Bundler)')
	}
});