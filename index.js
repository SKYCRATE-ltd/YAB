import {
	readlines,
	write
} from "computer";

import JST from "jst";

export function convert() {
	//
};

export function parse() {
	//
};

export function open() {
	// open file and get the lines...
	// multiline comments will be done like LBLOCK in my other tingy

	// We remove these things and then find the lines regarding
	// what modules need to be imported

	// each of those needs to be "embedded" into our template
		// we take the path we're on + the path of the script
		// (and some trickery for module names)
			// stored as a dictionary of functions and referenced by
			// a proxy which caches the module result into an object
		
			// When a module imports its dependencies, it is actually
			// passed the dependencies stored in a __modules__ object
			// and the module just has constant/variable declarations/assignments.

	// Not sure what to do about dynamic imports yet. Might leave it for now...
	
	// import statements are parsed for their map info
		// (how we render vars/consts to the passed __modules__)
		// (these replace the import statements
		//  since all we need are references to __modules__)
	// Then, we must parse our exports. These are tangled with the script
	// and not necessarily at the end. So, what we do is parse what we need
	// to and re-render the rest of the script with our assignments from
	// __modules__ at the top and the rest of the script below which replaces
	
	// named_val => class|function
	// ref => any previous declared and assigned var|let|const|<named_value>
	// val => <named_val>|new <ref>|<ref>
	// export default <val>; export (const|let|var) ref = val;
	// export named_val; 
};

export function render() {
	//
};

export function save() {
	//
};

export default function bundle() {
	//
};