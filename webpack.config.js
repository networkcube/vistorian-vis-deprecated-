const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
//const webpack = require('webpack');

module.exports = {
    target: 'web',
    mode: 'production',
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    plugins: [
        new CircularDependencyPlugin({
            exclude: /a\.js|node_modules/,
            failOnError: true,
            cwd: process.cwd(),
        })
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    devServer: {
        contentBase: './'
    },
    output: {
        library: "networkcube",
        libraryTarget: "umd",
        filename: 'vistorian-vis.js',
        path: path.resolve(__dirname, 'lib')
    }
};