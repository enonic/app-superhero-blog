var stk = require('stk/stk');
var menu = require('menu');

var portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    // Prevent the meta part from showing for AMP pages since these links take you to the search page and we only want AMP for post-show.
    var content = portal.getContent();
    var siteConfig = portal.getSiteConfig();
    var isAmp = false;
    if(req.params.amp && siteConfig.enableAmp && content.type == app.name + ':post') {
        isAmp = true;
    }

    function renderView() {
        var view = isAmp ? resolve('amp.html') : resolve('home.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {

        var up = req.params;
        var site = portal.getSite();
        var menuItems = menu.getSiteMenu(3);
        stk.data.deleteEmptyProperties(siteConfig);



        var bodyClass = '';
        var backgroundImage;
        if (siteConfig.backgroundImage) {
            var bgImageUrl = portal.imageUrl({
                id: siteConfig.backgroundImage,
                scale: '(1,1)',
                format: 'jpeg'
            });

            backgroundImage = '<style type="text/css" id="custom-background-css">body.custom-background { background-image: url("' +
                bgImageUrl + '"); background-repeat: repeat; background-position: top left; background-attachment: scroll; }</style>';

            bodyClass += 'custom-background ';
        }
        if ((content._path == site._path) && stk.data.isEmpty(up)) {
            bodyClass += 'home blog ';
        }
        if (up.cat || up.tag || up.author) {
            bodyClass += ' archive ';
        }
        if (content.type == app.name + ':post' || content.type == 'portal:page-template') {
            bodyClass += 'single single-post single-format-standard ';
        }
        if (up.author) {
            bodyClass += 'author '
        }

        var footerText = siteConfig.footerText ? portal.processHtml({value: siteConfig.footerText}): 'Configure footer text.';

        /*'<a href="https://enonic.com/" title="Fastest way from idea to ' +
            'digital experience." rel="generator">Proudly powered by Enonic XP</a> <span class="sep"> | </span> Theme: Superhero by ' +
            '<a href="https://wordpress.com/themes/" rel="designer">WordPress.com</a>.';*/

        var isFragment = content.type === 'portal:fragment';
        var model = {
            site: site,
            bodyClass: bodyClass,
            backgroundImage: backgroundImage,
            mainRegion: isFragment ? null : content.page.regions['main'],
            isFragment: isFragment,
            content: content,
            menuItems: menuItems,
            footerText: footerText,
            headerStyle: req.mode == 'edit' ? 'position: absolute;' : null,
            ampSupport: siteConfig.enableAmp && content.type == app.name + ':post'
        };

        return model;
    }

    return renderView();
}