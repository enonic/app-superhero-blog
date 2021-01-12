// Creates an assetUrls object on the first rendering unique to viewmode/branch.
// It provides the URLs to all assets used in this page controller and its templates/fragments.
// Will update when app is restarted/refreshed.
const portal = require('/lib/xp/portal');

const assetUrls = {};

exports.getAssetUrls = function(viewmode, branch) {
    const key = `${branch}_${viewmode}`;
    if (!assetUrls[key]) {
        // log.info(`Updating asset URLS: ${viewmode} / ${branch}`)
        assetUrls[key] = {
            html5Js: portal.assetUrl({path: 'js/html5.js'}),
            styleCss: portal.assetUrl({path: 'css/style.css'}),
            enonicCss: portal.assetUrl({path: 'css/enonic.css'}),
            flexsliderCss: portal.assetUrl({path: 'css/flexslider.css'}),
            fontCarroisCss: portal.assetUrl({path: 'css/google-font-carrois-gothic.css'}),
            loginCss: portal.assetUrl({path: 'css/login.min.css'}),
            buttonsCss: portal.assetUrl({path: 'css/buttons.min.css'}),
            dashiconsCss: portal.assetUrl({path: 'css/dashicons.min.css'}),

            jqueryJs: portal.assetUrl({path: "js/lib/jquery-3.3.1.min.js"}),
            superheroJs: portal.assetUrl({path: 'js/superhero.js'}),
            flexsliderJs: portal.assetUrl({path: 'js/lib/jquery.flexslider-min.js'}),
            commentReplyJs: portal.assetUrl({path: 'js/comment-reply.min.js'}),
            commentPostJs: portal.assetUrl({ path: "js/comment-post.js"})
        };
    }
    return assetUrls[key];
};
