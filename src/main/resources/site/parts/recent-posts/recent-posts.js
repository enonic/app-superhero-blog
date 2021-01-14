const util = require('/lib/utilities');

const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');
const thymeleaf = require('/lib/thymeleaf');

exports.get = function handleGet(req) {
    function renderView() {
        const view = resolve('recent-posts.html');
        const model = createModel();

        return {
            body: thymeleaf.render(view, model),
            contentType: 'text/html'
        };
    }

    function createModel() {
        const component = portal.getComponent();
        const config = component.config;
        const title = config.title || 'Recent posts';
        const maxPosts = config.maxPosts || 5;

        // Where to look for recent posts. Part config will override module config
        const folderPath = util.getPostsFolder();

        const result = contentLib.query({
            start: 0,
            count: maxPosts,
            query: '_parentPath="/content' + folderPath + '"',
            sort: 'createdTime DESC',
            contentTypes: [
                app.name + ':post'
            ]
        });

        const posts = [];

        // Build an object for each post with the displayName and URL and add it to the array of posts
        for (let i = 0; i < result.hits.length; i++) {
            const content = result.hits[i];
            const post = {};
            post.displayName = content.displayName;
            post.url = portal.pageUrl({
                path: content._path
            });
            posts.push(post);
        }

        const model = {
            posts: posts,
            title: title
        };

        return model;
    }

    return renderView();
}
