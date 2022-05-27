// in ./build.js
const rewire = require('rewire');
const path = require('path');
const defaults = rewire('react-scripts/scripts/build.js');
const config = defaults.__get__('config');

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
config.output.filename = 'jquery-pdf-viewer.js';
config.output.path = path.join(__dirname, 'build');
// config.output.libraryTarget = 'umd';
// config.output.library = 'jquery-pdf-viewer'

config.optimization.minimize = false;

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
    plugin.options['filename'] = 'jquery-pdf-viewer.default.css';
})

// const { FileListPlugin } = require('./file-list-plugin');

// config.plugins.push(new FileListPlugin())

// /**
//  * Do not mangle component names in production, for a better learning experience
//  * @link https://kentcdodds.com/blog/profile-a-react-app-for-performance#disable-function-name-mangling
//  */
// config.optimization.minimizer[0].options.terserOptions.keep_classnames = true;
// config.optimization.minimizer[0].options.terserOptions.keep_fnames = true;