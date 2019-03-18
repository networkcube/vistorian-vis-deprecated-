const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
//const webpack = require('webpack');

module.exports = {
    target: 'web',
    mode: 'production',
    devServer: {
        contentBase: './'
    }
};