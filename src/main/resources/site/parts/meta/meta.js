var stk = require('stk/stk');
var portal = require('/lib/xp/portal');
var auth = require('/lib/xp/auth');
var contentLib = require('/lib/xp/content');

exports.get = handleGet;

function handleGet(req) {

    // Prevent the meta part from showing for AMP pages since these links take you to the search page and we only want AMP for post-show.
    var content = portal.getContent();
    var siteConfig = portal.getSiteConfig();
    if(req.params.amp && siteConfig.enableAmp && content.type == app.name + ':post') {
        return;
    }

    function renderView() {

        var view = resolve('meta.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        var component = portal.getComponent();
        var config = component.config;
        var title = config.title || 'Meta';
        var user = auth.getUser();
        var site = portal.getSite();
        var userStoreKey = portal.getUserStoreKey();

        // items need url, text and linkTitle
        var items = [];

        var item = {};

        if(user) {
            item.text = 'Log out';
            item.url = item.url = portal.logoutUrl({
                redirect: portal.pageUrl({})
            });
            items.push(item);
        }

        if (userStoreKey && !user) {
            item.text = "Login";
            item.url = portal.loginUrl({
                redirect: portal.pageUrl({})
            });
            items.push(item);
        }

        var links = config.links;

        if(links) {
            links = stk.data.forceArray(links);

            for (var i = 0; i < links.length; i++) {
                var item = {};
                item.text = links[i].linkText;

                if(links[i].contentLink) {
                    item.url = portal.pageUrl({id: links[i].contentLink});
                    if(!links[i].linkText) {
                        var linkContent = contentLib.get({key: links[i].contentLink});
                        if(linkContent) {
                            item.text = linkContent.displayName;
                        }
                    }
                }

                if(links[i].externalUrl && links[i].externalUrl.length > 5) {
                    item.url = links[i].externalUrl;
                }

                if(links[i].linkTitle) {
                    item.linkTitle = links[i].linkTitle.trim();
                }

                items.push(item);
            }

        }

        items.push({
            text: 'RSS',
            url: portal.pageUrl({path: site._path}) + '/rss'
        });

        return {
            items: items,
            title: title
        };
    }

    return renderView();
}

