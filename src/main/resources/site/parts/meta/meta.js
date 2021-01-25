const thymeleaf = require('/lib/thymeleaf');
const dataUtils = require('/lib/data');
const portal = require('/lib/xp/portal');
const auth = require('/lib/xp/auth');
const contentLib = require('/lib/xp/content');

const view = resolve('meta.html');

exports.get = function handleGet(req) {

    const component = portal.getComponent();
    const config = component.config;
    const title = config.title || 'Meta';
    const user = auth.getUser();
    const site = portal.getSite();
    const idProviderKey = portal.getIdProviderKey();

    // items need url, text and linkTitle
    const items = [];

    const item = {};
    if(user) {
        item.text = 'Log out';
        item.url = item.url = portal.logoutUrl({
            redirect: portal.pageUrl({})
        });

    } else if (idProviderKey) {
        item.text = "Login";
        item.url = portal.loginUrl({
            redirect: portal.pageUrl({})
        });
    }

    items.push(item);

    let links = config.links;
    if(links) {
        links = dataUtils.forceArray(links);

        for (let i = 0; i < links.length; i++) {
            const item = {};
            item.text = links[i].linkText;

            if(links[i].contentLink) {
                item.url = portal.pageUrl({id: links[i].contentLink});
                if(!links[i].linkText) {
                    const linkContent = contentLib.get({key: links[i].contentLink});
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


    const model = {
        items: items,
        title: title
    };

    return {
        body: thymeleaf.render(view, model)
    };
}

