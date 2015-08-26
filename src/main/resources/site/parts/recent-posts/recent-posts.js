var util = require('utilities');

var contentSvc = require('/lib/xp/content');
var portal = require('/lib/xp/portal');
var thymeleaf = require('/lib/xp/thymeleaf');

exports.get = handleGet;

function handleGet(req) {

    function renderView() {
        var view = resolve('recent-posts.html');
        var model = createModel();

        return {
            body: thymeleaf.render( view, model ),
            contentType: 'text/html'
        };
    }

    function createModel() {
        var component = portal.getComponent();
        var config = component.config;
        var title = config.title || 'Recent posts';
        var maxPosts = config.maxPosts || 5;

        // Where to look for recent posts. Part config will override module config
        var folderPath = util.postsFolder(config.contentFolder);

        var result = contentSvc.query( {
            start: 0,
            count: maxPosts,
            query: '_parentPath="/content' + folderPath + '"',
            sort: 'createdTime DESC',
            contentTypes: [
                app.name + ':post'
            ]
        });

        var posts = [];

        // Build an object for each post with the displayName and URL and add it to the array of posts
        for (var i = 0; i < result.hits.length; i++) {
            var content = result.hits[i];
            var post = {};
            post.displayName = content.displayName;
            post.url = portal.pageUrl( {
                path: content._path
            });
            posts.push(post);
        }

        var model = {
            posts: posts,
            title: title
        };

        return model;
    }

    return renderView();
}