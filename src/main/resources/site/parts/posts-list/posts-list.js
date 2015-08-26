var stk = require('stk/stk');
var util = require('utilities');

var contentSvc = require('/lib/xp/content');
var portal = require('/lib/xp/portal');

exports.get = function(req) {

    var component = portal.getComponent();
    var config = component.config;
    var up = req.params; // URL params
    var content = portal.getContent();
    var site = portal.getSite();
    var siteConfig = portal.getSiteConfig();
    var postsPerPage = siteConfig.numPosts ? siteConfig.numPosts : 10;
    var newer = null, older = null; // For pagination
    var posts = [];
    var folderPath = util.postsFolder(config.contentFolder);
    var searchPage = util.getSearchPage();

    var categories = util.getCategories();

    var start = stk.data.isInt(up.paged) ? (up.paged - 1) * postsPerPage : 0;
    var header = {};
    var query = getQuery(up, folderPath, categories, header, site);

    // Only put sticky on top on the first page when there are no queries
    var orderBy = '';
    if (Object.keys(up).length == 0 || (Object.keys(up).length == 1 && up.paged)) {
        orderBy = 'data.stickyPost DESC, ';
    }
    orderBy += 'createdTime DESC';

    var results = contentSvc.query( {
        start: start,
        count: postsPerPage,
        query: query,
        sort: orderBy,
        contentTypes: [
            app.name + ':post'
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
            older = portal.pageUrl( {
                path: content._path == searchPage ? searchPage : site._path,
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

            newer = portal.pageUrl( {
                path: content._path == searchPage ? searchPage : site._path,
                params: urlParams
            });
        }
    }

    // Loop through the posts and get the comments, categories and author
    for (var i = 0; i < results.hits.length; i++) {
        var data = results.hits[i].data;
        data.title = results.hits[i].displayName;
        var categoriesArray = [];
        data.class = 'post-' + results.hits[i]._id + ' post type-post status-publish format-standard hentry';
        if (data.stickyPost && Object.keys(up).length == 0) {
            data.class += ' sticky';
        }

        var date = new Date(results.hits[i].createdTime);
        date = util.getFormattedDate(date);
        data.pubDate = date;

        data.path = results.hits[i]._path;
        data.createdTime = results.hits[i].createdTime;
        data.comments = contentSvc.query( {
            start: 0,
            count: 1000,
            query: "data.post = '" + results.hits[i]._id + "'",
            sort: 'createdTime DESC',
            contentTypes: [
                app.name + ':comment'
            ]
        });

        data.commentsText = data.comments.total == 0 ? 'Leave a comment' : data.comments.total + ' comment' + (+ data.comments.total > 1 ? 's' : '');

        data.author = stk.content.get(data.author);


        data.category = data.category ? stk.data.forceArray(data.category) : null;

        if (data.category) {
            for (var j = 0; j < data.category.length; j++) {
                if(data.category[j]) {
                    var category = util.getCategory({id: data.category[j]}, categories);
                    categoriesArray.push(category);
                    data.class += ' category-' + category._name + ' ';
                }
            }
        }

        data.categories = categoriesArray.length > 0 ? categoriesArray : null

        if (data.featuredImage) {
            var img = stk.content.get(data.featuredImage);
            data.fImageName = img.displayName;
            data.fImageUrl = portal.imageUrl( {
                id: data.featuredImage,
                scale: 'width(695)',
                format: 'jpeg'
            });
        }

        stk.data.deleteEmptyProperties(data);
        posts.push(data);
    }

    var params = {
        posts: posts,
        site: site,
        searchPage: searchPage,
        older: older,
        newer: newer,
        headerText: header.headerText
    }
    var view = resolve('post-list.html');
    return stk.view.render(view, params);
};



var getQuery = function(up, folderPath, categories, header, site) {
    // Default query
    var query = '_parentPath="/content' + folderPath + '" AND data.slideshow != "true"';

    //Search filter
    if (up.s) {
        //query = 'fulltext("data.post", "' + up.s + '", "AND") OR fulltext("data.title", "' + up.s + '", "AND")';
        query = 'fulltext("_allText", "' + up.s + '", "AND")';
        header.headerText = 'Search Results for: ' + up.s;
    }

    // Filter for tags
    if (up.tag) {
        query = 'data.tags LIKE "' + up.tag.toLowerCase() + '"';
        header.headerText = 'Tag Archives: ' + up.tag;
    }

    //Filter for categories.
    if (up.cat) {
        log.info('STK log %s', categories);

        var category = util.getCategory({name: up.cat}, categories);
        query = 'data.category IN ("' + category._id + '")';
        header.headerText = 'Category Archives: ' + category.displayName;
    }

    //Filter for authors
    if (up.author) {
        var authorResult = contentSvc.query( {
            count: 1,
            query: '_name LIKE "' + up.author + '"',
            contentTypes: [ app.name + ':author' ]
        });
        var authorContent = authorResult.hits[0];

        query = authorContent ? 'data.author LIKE "' + authorContent._id + '"' : 'data.author LIKE "0"';

        if (authorContent) {
            var authUrl = portal.pageUrl( {
                path: stk.content.getPath(site._path),
                params: { author: up.author }
            });
            header.headerText = 'Author Archives: <span class="vcard"><a href="' + authUrl + '" class="url fn n">' + authorContent.data.name + '</a></span>'
        } else {
            header.headerText = 'Author Archives: ' + up.author + ' not found';
        }
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

        var monthName = util.getMonthName(date);
        header.headerText = 'Monthly Archives: ' + monthName + ' ' + year;
    }
    return query;
};