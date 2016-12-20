var stk = require('stk/stk');
var util = require('utilities');
var thymeleaf = require('/lib/xp/thymeleaf');

var contentLib = require('/lib/xp/content');
var portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('featured.html');
        var model = createModel();

        return {
            body: thymeleaf.render(view, model)
        }
    }

    function createModel() {

        var component = portal.getComponent();
        var config = component.config;

        var featuredPosts = config.posts? getConfigPosts(config.posts) : getSlideshowPosts();

        var slides = makeSlides(featuredPosts);

        var model = {
            slides: slides,
            editMode: req.mode == 'edit' ? true : false
        }

        return model;
    }

    function makeSlides(hits) {
        var slides = [];
        for (var i = 0; i < hits.length; i++) {
            var content = hits[i];
            var data = content.data;
            var slide = {};
            var imgUrl = portal.imageUrl({
                id: data.featuredImage,
                scale: 'block(1024,355)'
            });

            slide.id = content._id;
            slide.name = content.displayName;
            slide.url = portal.pageUrl({path: content._path});
            slide.imageUrl = imgUrl;

            slides.push(slide);
        }
        return slides;
    }

    function getSlideshowPosts() {
        var folderPath = util.postsFolder();
        var query = '_parentPath="/content' + util.postsFolder() + '" AND data.featuredImage != "" AND data.slideshow = "true"';
        var orderBy = 'createdTime DESC';

        var results = contentLib.query({
            start: 0,
            count: 10,
            query: query,
            sort: orderBy,
            contentTypes: [
                app.name + ':post'
            ]
        });

        return removeInvalidPosts(results.hits);
    }

    function getConfigPosts(postIDs) {
        if(!postIDs) {
            return null;
        }
        var postIDs = stk.data.forceArray(postIDs);

        var query = '_id IN (' + JSON.stringify(postIDs).replace('[','').replace(']','') + ')';

        var results = contentLib.query({
            start: 0,
            count: 10,
            query: query,
            contentTypes: [app.name + ':post']
        });

        return removeInvalidPosts(results.hits);
    }


    function removeInvalidPosts(posts) {
        var posts = stk.data.forceArray(posts);
        var hits = [];
        for (var i = 0; i < posts.length; i++) {
            if(posts[i].data.featuredImage) {
                hits.push(posts[i]);
            }
        }
        return hits ? hits : null;
    }


    return renderView();
}