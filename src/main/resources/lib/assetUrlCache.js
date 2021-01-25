// Creates an assetUrls object on the first rendering unique to viewmode/branch.
// It provides the URLs to all assets used in this page controller and its templates/fragments.
// Will update when app is restarted/refreshed.
const portal = require('/lib/xp/portal');

const assetUrls = {};

exports.getAssetUrls = function(viewmode, branch) {
    const key = `${branch}_${viewmode}`;
    if (!assetUrls[key]) {
        assetUrls[key] = {
            html5Js: portal.assetUrl({path: 'js/html5.js'}),
            styleCss: portal.assetUrl({path: 'css/style.css'}),
            enonicCss: portal.assetUrl({path: 'css/enonic.css'}),
            flexsliderCss: portal.assetUrl({path: 'css/flexslider.css'}),
            fontCarroisCss: portal.assetUrl({path: 'css/google-font-carrois-gothic.css'}),
            buttonsCss: portal.assetUrl({path: 'css/buttons.min.css'}),

            jqueryJs: portal.assetUrl({path: "js/lib/jquery-3.3.1.min.js"}),
            superheroJs: portal.assetUrl({path: 'js/superhero.js'}),
            flexsliderJs: portal.assetUrl({path: 'js/lib/jquery.flexslider-min.js'}),
            commentsJs: portal.assetUrl({ path: "js/comments.js"})
        };
    }
    return assetUrls[key];
};
