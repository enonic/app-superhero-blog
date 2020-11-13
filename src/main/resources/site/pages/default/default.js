var thymeleaf = require('/lib/thymeleaf');
var menu = require('/lib/menu');
var stk = require('/lib/stk');
var portal = require('/lib/xp/portal');


var view = resolve('default.html');

var assetUrls = null;
function getAssetUrls() {
    if (!assetUrls) {
        log.info("Building assetUrls....");
        var assetUrls = {
            html5Js: portal.assetUrl({path: 'js/html5.js'}),
            styleCss: portal.assetUrl({path: 'css/style.css'}),
            enonicCss: portal.assetUrl({path: 'css/enonic.css'}),
            flexsliderCss: portal.assetUrl({path: 'css/flexslider.css'}),
            fontCarroisCss: portal.assetUrl({path: 'css/google-font-carrois-gothic.css'}),
            jqueryJs: portal.assetUrl({path: 'js/jquery-3.3.1.min.js'}),
            superheroJs: portal.assetUrl({path: 'js/superhero.js'}),
            flexsliderJs: portal.assetUrl({path: 'js/flexslider-min.js'}),
            smallMenuJs: portal.assetUrl({path: 'js/small-menu.js'}),
            commentReplyJs: portal.assetUrl({path: 'js/comment-reply.min.js'}),
        };
        log.info("Ok.")
        log.info("assetUrls (" +
            (Array.isArray(assetUrls) ?
                    ("array[" + assetUrls.length + "]") :
                    (typeof assetUrls + (assetUrls && typeof assetUrls === 'object' ? (" with keys: " + JSON.stringify(Object.keys(assetUrls))) : ""))
            ) + "): " + JSON.stringify(assetUrls, null, 2)
        );
    }
    return assetUrls;
}


function buildPageContributions(siteConfig) {
    if (siteConfig.backgroundImage) {
        var bgImageUrl = portal.imageUrl({
            id: siteConfig.backgroundImage,
            scale: '(1,1)',
            format: 'jpeg'
        });

        return {
            headEnd: '<style type="text/css" id="custom-background-css">' +
                        'body.custom-background { ' +
                    'background-image: url("' + bgImageUrl + '");' +
                    'background-repeat: repeat; ' +
                    'background-position: top left; ' +
                    'background-attachment: scroll; ' +
                    '}' +
                    '</style>'
        };
    }

    return undefined;
}


function buildBodyClass(site, siteConfig, content, params) {
    var bodyClass = '';
    if (siteConfig.backgroundImage) {
        bodyClass += 'custom-background ';
    }
    if ((content._path == site._path) && stk.data.isEmpty(params)) {
        bodyClass += 'home blog ';
    }
    if (params.cat || params.tag || params.author) {
        bodyClass += ' archive ';
    }
    if (content.type == app.name + ':post' || content.type == 'portal:page-template') {
        bodyClass += 'single single-post single-format-standard ';
    }
    if (params.author) {
        bodyClass += 'author '
    }

    return bodyClass;
}


function getPageItemClass(targetPath, currentContentPath) {
    return targetPath == currentContentPath ? 'current_page_item' : 'page_item';
}

function insertMenuItemPageUrls(menuitems, contentPath) {
    for (menuItem of menuitems) {
        menuItem.pageUrl = portal.pageUrl({path: menuItem.path});
        menuItem.class = getPageItemClass(menuItem.path, contentPath);

        if (menuItem.children) {
            for (menuItem2 of menuItem.children) {
                menuItem2.pageUrl = portal.pageUrl({path: menuItem2.path});
                menuItem2.class = getPageItemClass(menuItem2.path, contentPath);
            }
        }
    }
}


exports.get = function handleGet(req) {
    var params = req.params;
    var site = portal.getSite();
    var siteConfig = portal.getSiteConfig();
    stk.data.deleteEmptyProperties(siteConfig);
    var content = portal.getContent();
    log.info("content (" +
    	(Array.isArray(content) ?
    		("array[" + content.length + "]") :
    		(typeof content + (content && typeof content === 'object' ? (" with keys: " + JSON.stringify(Object.keys(content))) : ""))
    	) + "): " + JSON.stringify(content, null, 2)
    );


    var menuItems = menu.getSiteMenu(3);
    insertMenuItemPageUrls(menuItems, content._path);


    var footerText = siteConfig.footerText ? portal.processHtml({value: siteConfig.footerText}) : null;


    var isFragment = content.type === 'portal:fragment';
    var model = {
        assetUrls: getAssetUrls(),
        title: site.displayName,
        description: site.data.description,
        bodyClass: buildBodyClass(site, siteConfig, content, params),
        mainRegion: isFragment ? null : content.page.regions['main'],
        isFragment: isFragment,
        siteUrl: portal.pageUrl({path: site._path}),
        menuTopClass: getPageItemClass(site._path, content._path),
        menuItems: menuItems,
        footerText: footerText,
        headerStyle: req.mode == 'edit' ? 'position: absolute;' : null
    };

    log.info("model (" +
    	(Array.isArray(model) ?
    		("array[" + model.length + "]") :
    		(typeof model + (model && typeof model === 'object' ? (" with keys: " + JSON.stringify(Object.keys(model))) : ""))
    	) + "): " + JSON.stringify(model, null, 2)
    );

    log.info("pageContributions (" +
    	(Array.isArray(buildPageContributions(siteConfig)) ?
    		("array[" + buildPageContributions(siteConfig).length + "]") :
    		(typeof buildPageContributions(siteConfig) + (buildPageContributions(siteConfig) && typeof buildPageContributions(siteConfig) === 'object' ? (" with keys: " + JSON.stringify(Object.keys(buildPageContributions(siteConfig)))) : ""))
    	) + "): " + JSON.stringify(buildPageContributions(siteConfig), null, 2)
    );

    return {
        body: thymeleaf.render(view, model),
        pageContributions: buildPageContributions(siteConfig)
    }
};
