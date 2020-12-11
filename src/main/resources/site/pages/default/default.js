const thymeleaf = require('/lib/thymeleaf');
const menuLib = require('/lib/menu');
const stk = require('/lib/stk/stk');
const portal = require('/lib/xp/portal');
const assetUrlCache = require('/lib/assetUrlCache');

const view = resolve('default.html');


function buildBodyClass(site, siteConfig, content, params, backgroundImage) {
    let bodyClass = '';
    if (backgroundImage) {
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


/* Returns an adjusted version of the menu item tree:
    - Remove the top-level (site) node since we have a header with the site title linking back to the front page
    - Add a pageUrl field to each item with resolved link target (except folder-type items)
    - Adds a class field "page_item" to each item, unless the item is the current page, in which case: "current_page_item"
    - Children of each item are handled recursively
 */
function adjustMenuItems(menuItems, contentPath, sitePath) {
    const adjustedItems = [];
    for (let menuItem of menuItems) {
        if (menuItem.path !== sitePath) {

            menuItem.class = getPageItemClass(menuItem.path, contentPath);

            if (menuItem.type !== "base:folder") {
                menuItem.pageUrl = menuItem.url;
            }

            if (menuItem.children) {
                menuItem.children = adjustMenuItems(menuItem.children, contentPath, sitePath);
            }

            adjustedItems.push(menuItem);
        }
    }
    return adjustedItems;
}


exports.get = function handleGet(request) {
    const site = portal.getSite();
    const siteConfig = portal.getSiteConfig();

    stk.data.deleteEmptyProperties(siteConfig);
    const content = portal.getContent();

    const menuItems = menuLib.getMenuTree(1, {});

    const adjustedMenuItems = adjustMenuItems(menuItems.menuItems, content._path, site._path);

    const dashedAppName = app.name.replace(/\./g, "-");
    const siteCommon = site.x[dashedAppName].siteCommon;

    const backgroundImage = siteCommon.backgroundImage;

    const assetUrls = assetUrlCache.getAssetUrls(request.mode, request.branch);

    const isFragment = content.type === 'portal:fragment';
    const model = {
        assetUrls: assetUrls,
        title: site.displayName,
        description: site.data.description,
        bodyClass: buildBodyClass(site, siteConfig, content, request.params, backgroundImage),
        mainRegion: isFragment ? null : content.page.regions['main'],
        isFragment: isFragment,
        siteUrl: portal.pageUrl({path: site._path}),
        menuTopClass: getPageItemClass(site._path, content._path),
        menuItems: adjustedMenuItems,
        footerText: siteCommon.footerText ?
            portal.processHtml({value: siteCommon.footerText}) :
            null,
        backgroundImageUrl: (backgroundImage) ?
            portal.imageUrl({
                id: backgroundImage,
                scale: '(1,1)',
                format: 'jpeg'
            }) :
            null,
        headerStyle: request.mode == 'edit' ? 'position: absolute;' : null
    };


    return {
        body: thymeleaf.render(view, model),
        pageContributions: {
            // Insert here instead of in the HTML view itself, because some parts add some of these as their own page contribution.
            // This is the easiest way to prevent duplicates (which cause errors).
            headEnd: [
                `<script src="${assetUrls.jqueryJs}"></script>`,
                `<script src="${assetUrls.superheroJs}"></script>`,
                `<script src="${assetUrls.flexsliderJs}"></script>`,
            ]
        }
    }
};
