import "./module.js"; // (await)? import("./module.js");
/*
module.import("./module.js"); <- easy peasy
*/

// TODO: require statements
// require("./module.js") also TODO: .json
/*
	module.import("./module.js").exports; <- also easy peasy
*/
import Def from "./module.js"
/*
const [
	Def
] = (module => [
	module.default
])(module.import("./module.js"));
*/
import * as Mod from "./module.js";
/*
const [
	Mod
] = (module => [
	module.exports
])(module.import("./module.js"));
*/
import { bean, thing } from "./module.js";
/*
const [
	{ bean, thing }
] = (module => [
	module.exports
])(module.import("./module.js"));
*/
import Bride, * as Test from "./module.js";
/*
const [
	Bride,
	Test
] = (module => [
	module.default,
	module.exports
])(module.import("module.js"));
*/
import Whore, { Woman, boobs as tits } from "./module.js";
/*
const [
	Whore,
	{ Woman, tits }
] = ((module, exports = module.exports) => [
	module.default,
	{
		...exports,
		tits: exports.boobs
	);
])(module.import("module.js"));
*/

console.log([Test.bean, Test.that, Test.thing].join(' ') + '!');
console.log(Woman);
console.log(Whore);
console.log(Bride);
console.log(tits);
console.log(Test);

// We won't export anything here...
// Just make sure it converts properly... maybe