var stk = require('stk/stk');
var util = require('utilities');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var config = component.config;
    var up = req.params; // URL params
    var content = execute('portal.getContent');
    var site = execute('portal.getSite');
    var moduleConfig = site.data.moduleConfig.config;
    var postsPerPage = moduleConfig.numPosts ? moduleConfig.numPosts : 10;
    var newer = null, older = null; // For pagination
    var posts = new Array();

    var defaultLocation = site._path + '/posts'; //Default location to look for posts
    var folderPath = util.getPostsFolder(config.contentFolder, moduleConfig.postsFolder, defaultLocation);

    var start = stk.data.isInt(up.paged) ? (up.paged - 1) * postsPerPage : 0;

    // Default query
    var query = '_parentPath="/content' + folderPath + '" AND data.slideshow != "true"';

    //Search filter
    if (up.s) {
        query = 'fulltext("data.post", "' + up.s + '", "AND") OR fulltext("data.title", "' + up.s + '", "AND")';
    }

    // Filter for tags
    if (up.tag) {
        query = 'data.tags LIKE "' + up.tag.toLowerCase() + '"';
    }

    //Filter for categories.
    if (up.cat) {
        query = 'data.category IN ("' + up.cat + '")';
    }

    //Filter for authors
    if (up.author) {
        query = 'data.author LIKE "' + up.author + '"';
    }

    //Filter for monthly archives
    if (up.m && stk.data.isInt(up.m) && up.m.length == 6) {

        var year = up.m.substring(0,4); //Get the year from the querystring
        var month = up.m.substring(4,6); //Get the month from the querystring

        // Get the last day of the month for the content query
        var date = new Date(year, month, 0);
        var lastDay = date.getDate();

        var first = year + '-' + month + '-01T00:00:00Z';
        var last = year + '-' + month + '-' + lastDay + 'T23:59:59Z';

        query = '_parentPath="/content' + folderPath + '" AND createdTime > instant("' + first + '") AND createdTime < instant("' + last + '")';
    }

    // Only put sticky on top on the first when there are no queries
    var orderBy = '';
    if (Object.keys(up).length == 0 || (Object.keys(up).length == 1 && up.paged)) {
        orderBy = 'data.stickyPost DESC, ';
    }
    orderBy += 'createdTime DESC';

    var results = execute('content.query', {
        start: start,
        count: postsPerPage,
        query: query,
        sort: orderBy,
        contentTypes: [
            module.name + ':post'
        ]
    });

    // If the results total is more than the postsPerPage then it will need pagination.
    if (results.total > postsPerPage) {

        // Must include other URL params in the pagination links.
        var urlParams = {};
        for(var param in up) {
            if (param != 'paged') {
                urlParams[param] = up[param];
            }
        }

        // Needs an "older" link if...
        if (start < (results.total - postsPerPage)) {
            urlParams.paged = stk.data.isInt(up.paged) ? (parseInt(up.paged) + 1).toString() : 2;
            older = execute('portal.pageUrl', {
                path: site._path,
                params: urlParams
            });
        }
        // Needs a "newer" link if...
        if (start != 0) {

            if(stk.data.isInt(up.paged) && up.paged > 2) {
                urlParams.paged = (parseInt(up.paged) - 1).toString();
            } else {
                urlParams.paged = null;
            }

            newer = execute('portal.pageUrl', {
                path: site._path,
                params: urlParams
            });
        }
    }

    // Loop through the posts and get the comments, categories and author
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

        if (data.featuredImage) {
            var img = stk.content.get(data.featuredImage);
            data.fImageName = img.displayName;
            data.fImageUrl = execute('portal.imageUrl', {
                id: data.featuredImage,
                filter: 'scalewidth(695)',
                format: 'jpeg'
            });
        }

        stk.data.deleteEmptyProperties(data);
        posts.push(data);
    }

    var params = {
        posts: posts,
        site: site,
        older: older,
        newer: newer
    }
    var view = resolve('post-list.html');
    return stk.view.render(view, params);
};