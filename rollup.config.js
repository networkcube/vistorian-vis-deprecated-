import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import nodeResolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
    input: 'build/src/index.js',
    external: [
        'd3',
        'moment',
        'three',
        'vistorian-core/src/dynamicgraph',
        'vistorian-core/src/main',
        'vistorian-core/src/messenger',
        'vistorian-core/src/datamanager',
        'vistorian-core/src/utils',
        'jquery',
        'papaparse',
        'jstorage'
    ],
    output: [
        {
            file: 'lib/vistorian-vis.js',
            format: 'cjs',
            sourcemap: true,
            name: 'vis',
            globals: {
                'd3': 'd3',
                'moment': 'moment',
                'three': 'three',
                'vistorian-core/src/dynamicgraph': 'dynamicgraph',
                'vistorian-core/src/utils': 'utils',
                'vistorian-core/src/messenger': 'messenger',
                'vistorian-core/src/main': 'main',
                'vistorian-core/src/datamanager': 'datamanager',
                'jquery': '$',
                'papaparse': 'Papa',
                'jstorage': 'jstorage'
            }
        }],
    plugins: [
        nodeResolve(),
        commonjs(),
        json(),
        sourcemaps()
    ]
};
