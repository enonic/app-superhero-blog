const thymeleaf = require('/lib/thymeleaf');
const dataUtils = require('/lib/data');
const util = require('/lib/utilities');

const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');

const view = resolve('categories.html');

exports.get = function handleGet(req) {
    const component = portal.getComponent();
    const config = component.config;
    const title = config.title || 'Categories';
    const searchPath = util.getSearchPage();
    const categories = [];

    const result = contentLib.query({
        start: 0,
        count: 1000,
        //query: ,
        sort: 'displayName ASC',
        contentTypes: [
            app.name + ':category'
        ]
    });

    for (let i = 0; i < result.hits.length; i++) {
        const posts = contentLib.query({
            start: 0,
            count: 1000,
            query: 'data.category IN ("' + result.hits[i]._id + '")',
            sort: 'createdTime DESC',
            contentTypes: [
                app.name + ':post'
            ]
        });

        result.hits[i].data.numPosts = posts.total;

        if (posts.total > 0) {
            categories.push(result.hits[i]);
        }

        dataUtils.deleteEmptyProperties(result.hits[i].data);

    }

    const model = {
        categories: categories,
        config: config,
        title: title,
        searchPath: searchPath
    }

    return {
        body: thymeleaf.render(view, model)
    };
}
