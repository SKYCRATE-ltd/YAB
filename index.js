import {
	watch as watcher
} from "fs";
import {
	read as r,
	write,
	parent_dir,
} from "computer";
import {
	Type,
	Any
} from "zed";
import Program from "termite";

function pivot_dir(root, uri) {
	return uri.replace(root, '.');
}

function concat_dir(a, b) {
	// can't handle directories with dots in them... TODO: fix this...
	return `${a}/${b}`.replace(/\/\.\//g, '/').replace(/\/[\w-]+\/\.\.\//g, '/');
}

export class Module extends Type({
	path: String, // Where this module lives
	uri: String,
	source: String, // source code of the module
	_controller: AbortController,
	_signal_delay: Any,
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
					.map(x =>
						x.split(' as ')
							.map(x => x.replace(/(\/\*\s[0-9]+\.\s\*\/\s*)/g, '').trim())
					);
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
return `/*
	YAB (Yet Another Bundler)
	Generated on ${new Date().toLocaleString().replace(', ', ' @ ')}
*/
(modules => {
	(function __import__(uri, mod = modules[uri]) {
		if (!mod)
			throw \`MODULE NOT FOUND: \${uri}\`;
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
	})("${entry}");
})({
	// MODULES:
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
				// TODO: support
				/\bexport\s+default(\s+(class|function)(\s+[^({\s]+)?)?/g,
				(match, match2, type = '', name = '') => {
					name = name.trim();
					return (
						type &&
						name &&
						`${type === "class" ? "const" : "let"} ${name} = `
					) + `module.default = ${type}${name && ' ' + name}`;
				}
			]
		];
	}
	constructor(uri) {
		super();

		this.uri = uri;
		this.path = parent_dir(uri);

		this.source =
			this.imports.concat(this.exports)
				.reduce(
					(src, [pattern, replacer]) =>
						src.replace(pattern, replacer),
					this.read(uri)
				);
		
		Module.cache[uri] = this;
	}
	resolve_path(uri = this.uri) {
		return concat_dir(this.npm(uri) ? Module.node_modules : Module.root, uri)
				+ uri.endsWith('.js') ? '' : '/index.js';
	}
	read(uri = this.uri) {
		return r(this.resolve_path(uri))
				.split('\n')
				.map((x, i) => `/* ${i + 1}. */\t${x}`)
				.join('\n')
	}
	watch(listener, uri = this.resolve_path(this.uri)) {
		this._controller = new AbortController();
		watcher(uri, {
			signal: this._controller.signal
		}, (event, filename) => {
			if (filename) {
				if (this._signal_delay)
					return;
				this._signal_delay = setTimeout(() =>
					this._signal_delay = 0, 125);
				listener(event);
			}
		});
	}
	unwatch() {
		this._controller.abort();
	}
	npm(path = this.uri) {
		return !['.', '/'].includes(path.charAt(0));
	}
	import(path) {
		let uri = this.npm(path) ? path : concat_dir(this.path, path);
		return Module.import(uri) && `module.import("${uri}")`;
	}
	toString() {
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
		Module.root = parent_dir(entry_file);
		Module.node_modules = node_modules;

		this.header('YAB (Yet Another Bundler)');
		this.log(`IN: ${entry_file} -- OUT: ${output_file}`);
		this.info(`bundling source files...`);

		const MODULE = new Module(pivot_dir(Module.root, entry_file));
		write(
			output_file,
			this.println(
				Module.render_bundle(
					Module.cache,
					MODULE.uri
				)
			)
		);
		return Module.cache;
	},
	watch(
		entry_file = './index.js',
		output_file = './dist/build.js',
		node_modules = `./node_modules`
	) {
		let cache = this.pass(
			'build',
			entry_file,
			output_file,
			node_modules
		).filter(([uri]) => uri.startsWith('.'));
		// TODO: test this above filter...
		// should be best. Maybe node_modules watching
		// can be optional... smthg to consider...

		this.header(`WATCHING FILES:`);

		cache.forEach(([uri, module]) =>
			this.log(`Watching file ${uri}...`) &&
			module.watch(e => {
				this.info(`${uri} modified.`);
				// Todo: I can change this to be quicker...
				cache.forEach(([uri, module]) => module.unwatch());
				this.pass(
					'watch',
					entry_file,
					output_file,
					node_modules
				);
			})
		);
	},
	help(cmd) {
		// do stuff..
		if (cmd) {
			// Help for a specific cmd
		} else {
			this.list([
				'build <entry-file="./index.js"> <output-file="./dist/build.js"> <node_modules-dir="./node_modules">',
				'watch <entry-file="./index.js"> <output-file="./dist/build.js"> <node_modules-dir="./node_modules">'
			]);
		}
		this.header('YAB (Yet Another Bundler)')
	}
});