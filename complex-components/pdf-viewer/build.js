// There is build.js file for rewire-react-app
// See https://github.com/halfzebra/rewire-react-app

// in ./build.js
const os = require('os');
const rewire = require('rewire');
const path = require('path');
const defaults = rewire('react-scripts/scripts/build.js');
const config = defaults.__get__('config');

MINIFY=process.argv.length > 2 && process.argv[2] == 'minify';
console.log(`======================${os.EOL}Minify flag is ${MINIFY}${os.EOL}----------------------${os.EOL} Argv array is: ${process.argv}`);

// const { ReactComponentToJQueryPlugin } = require('./component-to-jquery-plugin');
// config.plugins.push(new ReactComponentToJQueryPlugin({
//     'componentName': 'PDFwrapper',
//     'jqueryPluginName': 'pdfViewer',
//     'inputFile': './src/components/PDFwrapper.tsx',
//     'outputFile': 'jquery-pdf-viewer.js',
// }))

// Disable stuff warnings
config.ignoreWarnings = [/Failed to parse source map/]

config.entry = './src/jquery-pdf-viewer.jsx';
config.output.filename = `jquery-pdf-viewer${MINIFY ? '.min': ''}.js`;
config.output.path = path.join(__dirname, 'build');
// config.output.libraryTarget = 'umd';
// config.output.library = 'jquery-pdf-viewer'

config.optimization.minimize = MINIFY;

config.externals = {
    // 'react': 'React',
    // 'react/addons': 'React',
    'jquery': 'jQuery'
}

// postcss activation
config.module.rules.push({
    test: /\.css$/i,
    use: ["postcss-loader"],
});
// CSS file-name
config.plugins.filter((plugin) => plugin.constructor.name === 'MiniCssExtractPlugin').forEach((plugin) => {
    plugin.options['filename'] = `jquery-pdf-viewer.default${MINIFY ? '.min': ''}.css`;
})

// const { FileListPlugin } = require('./file-list-plugin');

// config.plugins.push(new FileListPlugin())

// /**
//  * Do not mangle component names in production, for a better learning experience
//  * @link https://kentcdodds.com/blog/profile-a-react-app-for-performance#disable-function-name-mangling
//  */
// config.optimization.minimizer[0].options.terserOptions.keep_classnames = true;
// config.optimization.minimizer[0].options.terserOptions.keep_fnames = true;