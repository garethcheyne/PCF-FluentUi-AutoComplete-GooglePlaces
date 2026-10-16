// Merged into the pcf-scripts webpack config (enabled by featureconfig.json).
//
// @fluentui/react-icons styles its icons with @griffel/react, whose ES build
// imports 'react/jsx-runtime'. React 16.14 has that file but no "exports" map, so
// webpack's strict ES-module resolution refuses the extension-less request.
// Pointing the request at the file itself resolves it.
module.exports = {
    resolve: {
        alias: {
            'react/jsx-runtime': require.resolve('react/jsx-runtime'),
            'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
        },
    },
};
