const stk = require('/lib/stk/stk');
const portal = require('/lib/xp/portal');

const contentLib = require('/lib/xp/content');

exports.get = function handleGet(req) {
    function renderView() {
        const view = resolve('recent-comments.html');
        const model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        const component = portal.getComponent();
        const config = component.config;
        const maxComments = config.maxComments || 5;
        const title = config.title || 'Recent comments';
        const comments = [];

        const results = contentLib.query({
            start: 0,
            count: maxComments,
            //query: ,
            sort: 'createdTime DESC',
            contentTypes: [
                app.name + ':comment'
            ]
        });

        for (let i = 0; i < results.hits.length; i++) {
            stk.data.deleteEmptyProperties(results.hits[i].data);
            results.hits[i].data.key = results.hits[i]._id;

            const post = stk.content.get(results.hits[i].data.post);
            results.hits[i].data.postTitle = post.displayName;
            results.hits[i].data.postPath = post._path;

            comments.push(results.hits[i].data);
        }

        const model = {
            comments: comments,
            title: title
        }

        return model;
    }

    return renderView();
}

