var stk = require('stk/stk');
var util = require('utilities');

var contentSvc = require('/lib/xp/content');
var portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('featured.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {

        var component = portal.getComponent();
        var config = component.config;
        var up = req.params; // URL params
        var content = portal.getContent();
        var folderPath = util.postsFolder(config.postsFolder);

        var query = '_parentPath="/content' + folderPath + '" AND data.featuredImage != "" AND data.slideshow = "true"';
        var orderBy = 'createdTime DESC';

        var slides = new Array();

        var results = contentSvc.query( {
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
            var imgUrl = portal.imageUrl( {
                id: data.featuredImage,
                scale: 'width(1024)'
            });

            slide.id = content._id;
            slide.name = content.displayName;
            slide.url = portal.pageUrl( {path: content._path});
            slide.imageUrl = imgUrl;

            slides.push(slide);
        }

        var model = {
            slides: slides,
            editMode: req.mode == 'edit' ? true : false
        }

        return model;
    }

    return renderView();
}