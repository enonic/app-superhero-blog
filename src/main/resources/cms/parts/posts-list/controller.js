var stk = require('stk/stk');
var util = require('utilities');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var config = component.config;
    var up = req.params; // URL params
    //TODO: List posts by search
    var content = execute('portal.getContent');
    var site = execute('portal.getSite');
    var posts = new Array();
    var folderPath = config.contentFolder ? stk.content.getPath(config.contentFolder) : '/content/superhero/posts';

    var query = '_parentPath="/content' + folderPath + '"';

    //Search filter
    if(up.s) {
        query = 'data.post LIKE "' + up.s + '"';
        //query += ' AND data.enableComments LIKE "true"';
    }

    // Filter for tags
    if (up.tag) {
        query = 'data.tags LIKE "' + up.tag + '"';
    }

    //Filter for categories. TODO: Find a better way to check for null when uncategorized.
    if (up.cat && up.cat != 'uncategorized') {
        query = 'data.category IN ("' + up.cat + '")';
    } else if (up.cat == 'uncategorized') {

        var cats = execute('content.query', {
            contentTypes: [
                module.name + ':category'
            ]
        });

        var catString = '';
        for (var i = 0; i < cats.contents.length; i++) {
            catString += '"' + cats.contents[i]._id + '"';
            if (i != cats.contents.length - 1) {
                catString += ',';
            }
        }

        query = 'data.category NOT IN (' + catString + ')';
    }

    //Filter for authors
    if (up.author) {
        query = 'data.author LIKE "' + up.author + '"';
    }

    //stk.log(query);

    var results = execute('content.query', {
        start: stk.data.isInt(up.index) ? up.index : 0,
        count: 20,
        query: query,
        sort: 'createdTime DESC',
        contentTypes: [
            module.name + ':post'
        ]
    });

    //stk.log(results);

    for (var i = 0; i < results.contents.length; i++) {
        var data = results.contents[i].data;
        var categories = new Array();

        var date = new Date(results.contents[i].createdTime);
        date = util.getFormattedDate(date);
        data.pubDate = date;

        data.path = results.contents[i]._path;
        data.createdTime = results.contents[i].createdTime;
        data.comments = execute('content.query', {
            start: 0,
            count: 1000,
            query: "data.post = '" + results.contents[i]._id + "'",
            sort: 'createdTime DESC',
            contentTypes: [
                module.name + ':comment'
            ]
        });

        data.commentsText = data.comments.total == 0 ? 'Leave a comment' : data.comments.total + ' comment' + (+ data.comments.total > 1 ? 's' : '');

        data.author = stk.content.get(data.author);


        data.category = data.category ? stk.data.forceArray(data.category) : null;

        if (data.category) {
            for (var j = 0; j < data.category.length; j++) {
                if(data.category[j]) {
                    var category = stk.content.get(data.category[j]);
                    categories.push(category);
                }
            }
        }

        data.categories = categories.length > 0 ? categories : null

        stk.data.deleteEmptyProperties(data);
        posts.push(data);
    }

    //stk.log(posts);
    var params = {
        posts: posts,
        site: site
    }
    var view = resolve('post-list.html');
    return stk.view.render(view, params);
};