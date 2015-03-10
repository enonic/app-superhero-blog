var stk = require('stk/stk');
var util = require('utilities');

exports.get = function(req) {
    var component = execute('portal.getComponent');
    var config = component.config;
    var up = req.params; // URL params
    var content = execute('portal.getContent');
    var site = execute('portal.getSite');
    var moduleConfig = site.moduleConfigs[module.name];
    var defaultLocation = site._path + '/posts'; //Default location to look for posts
    var folderPath = util.getPostsFolder(config.postsFolder, moduleConfig.postsFolder, defaultLocation);

    var query = '_parentPath="/content' + folderPath + '" AND data.featuredImage != "" AND data.slideshow = "true"';

    var orderBy = 'createdTime DESC';

    var slides = new Array();

    // Only show this on the post list page when there are no filters.
    if(Object.keys(up).length == 0 || (Object.keys(up).length == 1 && stk.data.isInt(up.paged))) {
        var results = execute('content.query', {
            start: 0,
            count: 10,
            query: query,
            sort: orderBy,
            contentTypes: [
                module.name + ':post'
            ]
        });

        for (var i = 0; i < results.contents.length; i++) {
            var content = results.contents[i];
            var data = content.data;
            var slide = {};
            var imgUrl = execute('portal.imageUrl', {
                id: data.featuredImage,
                filter: 'scalewidth(1024)'
            });

            slide.id = content._id;
            slide.name = content.displayName;
            slide.url = execute('portal.pageUrl', {path: content._path});
            slide.imageUrl = imgUrl;

            slides.push(slide);
        }
    }


    var params = {
        slides: slides,
        editMode: req.mode == 'edit' ? true : false
    }

    var view = resolve('featured.html');
    return stk.view.render(view, params);
};