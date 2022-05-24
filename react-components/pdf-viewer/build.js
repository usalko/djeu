// in ./build.js
const rewire = require('rewire');
const defaults = rewire('react-scripts/scripts/build.js');
const config = defaults.__get__('config');

const { FileListPlugin } = require('./file-list-plugin.js');

config.plugins.push(new FileListPlugin())

// /**
//  * Do not mangle component names in production, for a better learning experience
//  * @link https://kentcdodds.com/blog/profile-a-react-app-for-performance#disable-function-name-mangling
//  */
// config.optimization.minimizer[0].options.terserOptions.keep_classnames = true;
// config.optimization.minimizer[0].options.terserOptions.keep_fnames = true;