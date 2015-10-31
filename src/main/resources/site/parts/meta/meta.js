var stk = require('stk/stk');
var portal = require('/lib/xp/portal');
var auth = require('/lib/xp/auth');

var contentLib = require('/lib/xp/content');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var logout = req.params.logout;

        if (logout) {
            auth.logout();
            return {
                redirect: portal.pageUrl({id: portal.getSite()._id})
            }
        }

        var view = resolve('meta.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        var component = portal.getComponent();
        var config = component.config;
        var siteConfig = portal.getSiteConfig();
        var title = config.title || 'Meta';
        var user = auth.getUser();

        // items need url, text and linkTitle
        var items = [];

        var item = {};

        if(user) {
            item.text = 'Log out';
            item.url = portal.componentUrl({params:{logout: 'true'}});
            items.push(item);
        }

        if(!siteConfig.noLogin && siteConfig.loginPage && !user) {
            item.text = "Login";
            item.url = portal.pageUrl({id: siteConfig.loginPage});
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

        var model = {
            items: items,
            title: title
        }

        return model;
    }

    return renderView();
}

