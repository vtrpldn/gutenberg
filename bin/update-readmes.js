/**
 * External dependencies
 */
const { join, relative, resolve, sep } = require( 'path' );
const glob = require( 'fast-glob' );
const execa = require( 'execa' );
const { Transform } = require( 'stream' );
const { readFile } = require( 'fs' ).promises;

/**
 * README file tokens, defined as a tuple of token identifier, source path.
 *
 * @typedef {[string,string]} WPReadmeFileTokens
 */

/**
 * README file data, defined as a tuple of README file path, token details.
 *
 * @typedef {[string,WPReadmeFileTokens]} WPReadmeFileData
 */

/**
 * Path to packages directory.
 *
 * @type {string}
 */
const PACKAGES_DIR = resolve( __dirname, '../packages' );

/**
 * Pattern matching start token of a README file.
 *
 * @type {RegExp}
 */
const TOKEN_PATTERN = /<!-- START TOKEN\((.+?(?:\|(.+?))?)\) -->/g;

/**
 * Given an absolute file path, returns the package name.
 *
 * @param {string} file Absolute path.
 *
 * @return {string} Package name.
 */
function getFilePackage( file ) {
	return relative( PACKAGES_DIR, file ).split( sep )[ 0 ];
}

/**
 * Stream transform which filters out README files to include only those
 * containing matched token pattern, yielding a tuple of the file and its
 * matched tokens.
 *
 * @type {Transform}
 */
const filterTokenTransform = new Transform( {
	objectMode: true,

	async transform( file, _encoding, callback ) {
		let content;
		try {
			content = await readFile( file, 'utf8' );
		} catch {}

		if ( content ) {
			const tokens = [];

			for ( const match of content.matchAll( TOKEN_PATTERN ) ) {
				const [ , token, path = 'src/index.js' ] = match;
				tokens.push( [ token, path ] );
			}

			if ( tokens.length ) {
				this.push( [ file, tokens ] );
			}
		}

		callback();
	},
} );

/**
 * Optional process arguments for which to generate documentation.
 *
 * @type {string[]}
 */
const files = process.argv.slice( 2 );

/**
 * Glob pattern to use for packages, using process arguments if provided, or
 * otherwise assuming to match all packages.
 *
 * @type {string}
 */
const packages = files.length ? files.map( getFilePackage ).join() : '*';

glob.stream( [ `${ PACKAGES_DIR }/${ packages }/README.md` ] )
	.pipe( filterTokenTransform )
	.on( 'data', async ( /** @type {WPReadmeFileData} */ data ) => {
		const [ file, tokens ] = data;

		// Each target operates over the same file, so it needs to be processed
		// synchronously, to make sure the processes don't overwrite eachother.
		await tokens.reduce( async ( result, [ token, path ] ) => {
			await result;

			const packageName = getFilePackage( file );
			try {
				await execa(
					join( __dirname, '..', 'node_modules', '.bin', 'docgen' ),
					[
						join( 'packages', packageName, path ),
						`--output packages/${ packageName }/README.md`,
						'--to-token',
						`--use-token "${ token }"`,
						'--ignore "/unstable|experimental/i"',
					],
					{ shell: true }
				);
			} catch ( error ) {
				// Disable reason: Errors should log to console.

				// eslint-disable-next-line no-console
				console.error( error );
				process.exit( 1 );
			}
		}, Promise.resolve() );
	} );
