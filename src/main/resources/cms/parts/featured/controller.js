var stk = require('stk/stk');
var util = require('utilities');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('featured.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {

        var component = execute('portal.getComponent');
        var config = component.config;
        var up = req.params; // URL params
        var content = execute('portal.getContent');
        var folderPath = util.postsFolder(config.postsFolder);

        var query = '_parentPath="/content' + folderPath + '" AND data.featuredImage != "" AND data.slideshow = "true"';
        var orderBy = 'createdTime DESC';

        var slides = new Array();

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
                filter: 'scaleblock(1024,355)' // Keeps the aspect ratio the same for all pictures. Original should be at least 1024 wide.
            });

            slide.id = content._id;
            slide.name = content.displayName;
            slide.url = execute('portal.pageUrl', {path: content._path});
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