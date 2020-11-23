const thymeleaf = require('/lib/thymeleaf');
const menuLib = require('/lib/menu');
const stk = require('/lib/stk/stk');
const portal = require('/lib/xp/portal');

const view = resolve('default.html');



// Creates an assetUrls object on the first rendering.
// It provides the URLs to all assets used in this page controller and its templates/fragments:
let assetUrls = null;
function getAssetUrls() {
    if (!assetUrls) {
        assetUrls = {
            html5Js: portal.assetUrl({path: 'js/html5.js'}),
            styleCss: portal.assetUrl({path: 'css/style.css'}),
            enonicCss: portal.assetUrl({path: 'css/enonic.css'}),
            flexsliderCss: portal.assetUrl({path: 'css/flexslider.css'}),
            fontCarroisCss: portal.assetUrl({path: 'css/google-font-carrois-gothic.css'}),
            jqueryJs: portal.assetUrl({path: 'js/jquery-3.3.1.min.js'}),
            superheroJs: portal.assetUrl({path: 'js/superhero.js'}),
            flexsliderJs: portal.assetUrl({path: 'js/jquery.flexslider-min.js'}),
            smallMenuJs: portal.assetUrl({path: 'js/small-menu.js'}),
            commentReplyJs: portal.assetUrl({path: 'js/comment-reply.min.js'}),
        };
    }
    return assetUrls;
}


function buildBodyClass(site, siteConfig, content, params) {
    let bodyClass = '';
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


function mutateMenuItems(menuItems, contentPath) {
    for (menuItem of menuItems) {
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


exports.get = function handleGet(request) {
    const site = portal.getSite();
    const siteConfig = portal.getSiteConfig();
    stk.data.deleteEmptyProperties(siteConfig);
    const content = portal.getContent();


    const menuItems = menuLib.getMenuTree(3);

    log.info("menuItems PRE (" +
    	(Array.isArray(menuItems) ?
    		("array[" + menuItems.length + "]") :
    		(typeof menuItems + (menuItems && typeof menuItems === 'object' ? (" with keys: " + JSON.stringify(Object.keys(menuItems))) : ""))
    	) + "): " + JSON.stringify(menuItems, null, 2)
    );

    mutateMenuItems(menuItems, content._path);

    log.info("menuItems POST (" +
    	(Array.isArray(menuItems) ?
    		("array[" + menuItems.length + "]") :
    		(typeof menuItems + (menuItems && typeof menuItems === 'object' ? (" with keys: " + JSON.stringify(Object.keys(menuItems))) : ""))
    	) + "): " + JSON.stringify(menuItems, null, 2)
    );

    const isFragment = content.type === 'portal:fragment';
    const model = {
        assetUrls: getAssetUrls(),
        title: site.displayName,
        description: site.data.description,
        bodyClass: buildBodyClass(site, siteConfig, content, request.params),
        mainRegion: isFragment ? null : content.page.regions['main'],
        isFragment: isFragment,
        siteUrl: portal.pageUrl({path: site._path}),
        menuTopClass: getPageItemClass(site._path, content._path),
        menuItems: menuItems,
        footerText: siteConfig.footerText ?
            portal.processHtml({value: siteConfig.footerText}) :
            null,
        backgroundImageUrl: (siteConfig.backgroundImage) ?
            portal.imageUrl({
                id: siteConfig.backgroundImage,
                scale: '(1,1)',
                format: 'jpeg'
            }) :
            null,
        headerStyle: request.mode == 'edit' ? 'position: absolute;' : null
    };

    return {
        body: thymeleaf.render(view, model)
    }
};
