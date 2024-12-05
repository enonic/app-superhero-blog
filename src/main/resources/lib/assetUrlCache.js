// Creates an assetUrls object on the first rendering unique to viewmode/branch.
// It provides the URLs to all assets used in this page controller and its templates/fragments.
// Will update when app is restarted/refreshed.
const assetLib = require('/lib/enonic/asset');

const assetUrls = {};

exports.getAssetUrls = function(viewmode, branch) {
    const key = `${branch}_${viewmode}`;
    if (!assetUrls[key]) {
        assetUrls[key] = {
            html5Js: assetLib.assetUrl({path: 'js/html5.js'}),
            styleCss: assetLib.assetUrl({path: 'css/style.css'}),
            enonicCss: assetLib.assetUrl({path: 'css/enonic.css'}),
            flexsliderCss: assetLib.assetUrl({path: 'css/flexslider.css'}),
            fontCarroisCss: assetLib.assetUrl({path: 'css/google-font-carrois-gothic.css'}),
            buttonsCss: assetLib.assetUrl({path: 'css/buttons.min.css'}),

            jqueryJs: assetLib.assetUrl({path: "js/lib/jquery-3.3.1.min.js"}),
            superheroJs: assetLib.assetUrl({path: 'js/superhero.js'}),
            flexsliderJs: assetLib.assetUrl({path: 'js/lib/jquery.flexslider-min.js'}),
            commentsJs: assetLib.assetUrl({ path: "js/comments.js"})
        };
    }
    return assetUrls[key];
};
