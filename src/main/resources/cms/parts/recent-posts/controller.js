var util = require('utilities');

exports.get = handleGet;

function handleGet(req) {

    function renderView() {
        var view = resolve('recent-posts.html');
        var model = createModel();

        return {
            body: execute('thymeleaf.render', {
                view: view,
                model: model
            }),
            contentType: 'text/html'
        };
    }

    function createModel() {
        var component = execute('portal.getComponent');
        var config = component.config;
        var title = config.title || 'Recent posts';
        var maxPosts = config.maxPosts || 5;

        // Where to look for recent posts. Part config will override module config
        var folderPath = util.postsFolder(config.contentFolder);

        var result = execute('content.query', {
            start: 0,
            count: maxPosts,
            query: '_parentPath="/content' + folderPath + '"',
            sort: 'createdTime DESC',
            contentTypes: [
                module.name + ':post'
            ]
        });

        var posts = new Array();

        // Build an object for each post with the displayName and URL and add it to the array of posts
        for (var i = 0; i < result.contents.length; i++) {
            var content = result.contents[i];
            var post = {};
            post.displayName = content.displayName;
            post.url = execute('portal.pageUrl', {
                path: content._path
            });
            posts.push(post);
        }

        var model = {
            posts: posts,
            title: title
        }

        return model;
    }

    return renderView();
}