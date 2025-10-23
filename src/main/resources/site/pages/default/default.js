const thymeleaf = require('/lib/thymeleaf');
const dataUtils = require('/lib/data');
const portal = require('/lib/xp/portal');
const assetUrlCache = require('/lib/assetUrlCache');
const auth = require('/lib/xp/auth');
const view = resolve('default.html');


function buildBodyClass(site, siteConfig, content, params, backgroundImage) {
    let bodyClass = '';
    if (backgroundImage) {
        bodyClass += 'custom-background ';
    }
    if ((content._path == site._path) && dataUtils.isEmpty(params)) {
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



exports.get = function handleGet(request) {
    const site = portal.getSite();
    const siteConfig = portal.getSiteConfig();

    dataUtils.deleteEmptyProperties(siteConfig);
    const content = portal.getContent();
    const loggedInUser = auth.getUser();

    const dashedAppName = app.name.replace(/\./g, "-");
    const siteCommon = site.x[dashedAppName].siteCommon;

    const backgroundImage = siteCommon.backgroundImage;

    const assetUrls = assetUrlCache.getAssetUrls(request.mode, request.branch);

    const isFragment = content.type === 'portal:fragment';
    const model = {
        user: loggedInUser, 
        assetUrls: assetUrls,
        title: site.displayName,
        description: site.data.description,
        bodyClass: buildBodyClass(site, siteConfig, content, request.params, backgroundImage),
        mainRegion: isFragment ? null : content.page.regions['main'],
        isFragment: isFragment,
        siteUrl: portal.pageUrl({path: site._path}),
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
