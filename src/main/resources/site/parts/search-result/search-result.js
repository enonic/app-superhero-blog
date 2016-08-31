var libs = {
    content: require('/lib/xp/content'),
    portal: require('/lib/xp/portal')
};

var stk = require('stk/stk');
var util = require('utilities');

var contentLib = require('/lib/xp/content');
var portal = require('/lib/xp/portal');

exports.get = function(req) {

    var component = portal.getComponent();
    var config = component.config;
    var up = req.params; // URL params
    var content = portal.getContent();
    var site = portal.getSite();
    var siteConfig = portal.getSiteConfig();
    //var postsPerPage = siteConfig.numPosts ? siteConfig.numPosts : 10;
    var postsPerPage = 100;
    var newer = null, older = null; // For pagination
    var posts = [];
    var folderPath = util.postsFolder(config.contentFolder);
    var searchPage = util.getSearchPage();

    var categories = util.getCategories();

    var start = stk.data.isInt(up.paged) ? (up.paged - 1) * postsPerPage : 0;
    var header = {};
    var query = getQuery(up, folderPath, categories, header, site);

    //stk.log(query);

    // Only put sticky on top on the first page when there are no queries
    var orderBy = '';
    if (Object.keys(up).length == 0 || (Object.keys(up).length == 1 && up.paged)) {
        orderBy = 'data.stickyPost DESC, ';
    }
    orderBy += 'createdTime DESC';

    var results = contentLib.query({
        start: start,
        count: postsPerPage,
        query: query,
        sort: orderBy,
        contentTypes: [
            app.name + ':post',
            app.name + ':landing-page'
        ]
    });

    //stk.log(results);

    var hasPosts = results.hits.length > 0? true : false;

    var numMatches = results.total;

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
            older = portal.pageUrl({
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

            newer = portal.pageUrl({
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
        data.comments = contentLib.query({
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
                if(data.category[j] && stk.content.exists(data.category[j])) {
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
            data.fImageUrl = portal.imageUrl({
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
        headerText: header.headerText,
        hasPosts: hasPosts,
        numMatches: numMatches,
        searchTerm: up.s,
        aggregations: getAggregations(),
        componentUrl: portal.componentUrl({}),
        pageUrl: portal.pageUrl({}),
        urlParams: up,
        tags: getTags()
    };

    //log.info('UTIL log %s', JSON.stringify(up, null, 4));

    function getAggregations() {
        var aggregations = {
            date: getDateAggregation(),
            cty: getCtyAggregations(),
            author: getAuthorAggregations(),
            category: getCategoryAggregations()
        };

        return aggregations;
    }

    function getDateAggregation() {
        var relevantMonths = [];

        var urlParamsFiltered = clone(up);
        urlParamsFiltered.m = undefined;

        var result = libs.content.query({
            //query: "ngram('_allText', '" + searchTerm + "', 'AND') ",
            //query: "ngram('displayName', '" + searchTerm + "', 'AND') ",
            query: getQuery(urlParamsFiltered, folderPath, categories, header, site),
            count: 0,
            contentTypes: [app.name + ':post', app.name + ':landing-page'],
            aggregations: {
                "byMonth": {
                    "dateHistogram": {
                        "field": "createdTime",
                        "interval": "1M",
                        "minDocCount": 0,
                        "format": "MM-yyy"
                    }
                }
            }
        });

        result.aggregations.byMonth.buckets.forEach(function(item) {
            if (item.docCount !== 0) {
                var monthParts = item.key.split('-');
                item.month = monthParts[1] + monthParts[0];
                relevantMonths.push(item);

                item.docCount = item.docCount | 0;


                if (up.m && up.m.indexOf(item.month) !== -1) {
                    item.checked = true;
                }

            }
        });

        return relevantMonths;
    }

    function getCtyAggregations() {

        var urlParamsFiltered = clone(up);
        urlParamsFiltered.cty = undefined;

        var result = libs.content.query({
            //query: "ngram('_allText', '" + searchTerm + "', 'AND') ",
            //query: "ngram('displayName', '" + searchTerm + "', 'AND') ",
            query: getQuery(urlParamsFiltered, folderPath, categories, header, site),
            count: 0,
            contentTypes: [app.name + ':post', app.name + ':landing-page'],
            aggregations: {
                "cty": {
                    terms: {
                        field: "type",
                        order: "_count DESC"
                    }
                }
            }
        });

        result.aggregations.cty.buckets.forEach(function(item) {
            switch (item.key) {
                case app.name + ':post':
                    item.shortName = 'post';
                    item.displayName = 'Post';
                    break;
                case app.name + ':landing-page':
                    item.shortName = 'landing-page';
                    item.displayName = 'Landing page';
                    break;
            }

            item.docCount = item.docCount | 0;

            if (up.cty && up.cty.indexOf(item.shortName) !== -1) {
                item.checked = true;
            }
        });

        return result.aggregations.cty.buckets;
    }

    function getAuthorAggregations() {

        var urlParamsFiltered = clone(up);
        urlParamsFiltered.author = undefined;

        var result = libs.content.query({
            //query: "ngram('_allText', '" + searchTerm + "', 'AND') ",
            //query: "ngram('displayName', '" + searchTerm + "', 'AND') ",
            query: getQuery(urlParamsFiltered, folderPath, categories, header, site),
            count: 0,
            contentTypes: [app.name + ':post', app.name + ':landing-page'],
            aggregations: {
                "authors": {
                    terms: {
                        field: "data.author",
                        order: "_count DESC"
                    }
                }
            }
        });

        result.aggregations.authors.buckets.forEach(function(item) {
            var author = getAuthor(item.key);
            item.displayName = author.displayName;
            item.name = author._name;

            item.docCount = item.docCount | 0;

            if (up.author && up.author.indexOf(item.key) !== -1) {
                item.checked = true;
            }
        });

        return result.aggregations.authors.buckets;
    }

    function getCategoryAggregations() {

        var urlParamsFiltered = clone(up);
        urlParamsFiltered.cat = undefined;

        var result = libs.content.query({
            //query: "ngram('_allText', '" + searchTerm + "', 'AND') ",
            //query: "ngram('displayName', '" + searchTerm + "', 'AND') ",
            query: getQuery(urlParamsFiltered, folderPath, categories, header, site),
            count: 0,
            contentTypes: [app.name + ':post', app.name + ':landing-page'],
            aggregations: {
                "categories": {
                    terms: {
                        field: "data.category",
                        order: "_count DESC"
                    }
                }
            }
        });

        result.aggregations.categories.buckets.forEach(function(item) {
            var category = getCategory(item.key);
            item.displayName = category.displayName;
            item.name = category._name;

            item.docCount = item.docCount | 0;

            if (up.cat && up.cat.indexOf(item.key) !== -1) {
                item.checked = true;
            }


        });

        return result.aggregations.categories.buckets;
    }

    function getAuthor(id) {

        var author = stk.content.get(id);

        return author;
    }

    function getCategory(id) {

        var category = stk.content.get(id);

        return category;
    }

    /*function getAggregations(contentType, searchTerm) {




        var result = libs.content.query({
            query: "ngram('_allText', '" + searchTerm + "', 'AND') ",
            //query: "ngram('displayName', '" + searchTerm + "', 'AND') ",
            count: 0,
            contentTypes: [app.name + ':post'],
            aggregations: {
                "categories": {
                    terms: {
                        field: "data.category",
                        order: "_count DESC"
                    }
                }
            }
        });










        var aggregations = result.aggregations.contentTypes.buckets;


        /!**
         *
         * temp
         *!/

        var paginationCount = 10;
        var paginationStart = 0;
        /!**
         * temp end
         *!/

        aggregations.forEach(function(e) {
            switch (e.key) {
                case app.name + ':author':
                    e.name = 'Author';
                    break;
                case app.name + ':category':
                    e.name = 'Category';
                    break;
                case app.name + ':landing-page':
                    e.name = 'Landing page';
                    break;
                case app.name + ':post':
                    e.name = 'Blog post';
                    break;
            }

            e.hits = getResults(searchTerm, [e.key], 4, 0);

            e.pagination = {
                url: libs.portal.componentUrl({
                    params: {
                        q: searchTerm,
                        preq: true,
                        cty: e.key.split(':').pop()
                    }
                }),
                count: paginationCount,
                start: paginationStart,
                total: e.docCount
            };


        });

        return aggregations;
    }*/

    function getResults(searchTerm, contentTypes, count, start) {
        var result = libs.content.query({
            query: "ngram('displayName', '" + searchTerm + "', 'AND') ",
            count: count,
            start: start,
            contentTypes: contentTypes
        });



        return result.hits;
    }

    function getTags() {
        //var site = portal.getSite();

        // Get all posts that have one or more tags.
        var result = contentLib.query({
            start: 0,
            count: 0,
            //query: "_path LIKE '/content" + site._path + "/*'", // Only get tags from this site.
            query: getQuery(up, folderPath, categories, header, site),
            contentTypes: [
                app.name + ':post',
                app.name + ':landing-page'
            ],
            aggregations: {
                tags: {
                    terms: {
                        field: "data.tags",
                        order: "_term asc",
                        size: 20
                    }
                }
            }
        });

        //stk.log(result);

        var buckets = null;

        if (result && result.aggregations && result.aggregations.tags && result.aggregations.tags.buckets) {
            buckets = [];

            var results = result.aggregations.tags.buckets;

            // Prevent ghost tags from appearing in the part
            for (var i = 0; i < results.length; i++) {
                if (results[i].docCount > 0) {
                    buckets.push(results[i]);
                }
            }

            if (buckets.length > 0) {

                // Make the font sizes
                var smallest = 8;
                var largest = 22;

                //Get the max and min counts
                var newBucket = buckets.slice();
                newBucket.sort(function (a, b) {
                    return a.docCount - b.docCount;
                });
                var minCount = newBucket[0].docCount; // smallest number for any tag count
                var maxCount = newBucket[newBucket.length - 1].docCount; // largest number for any tag count

                // The difference between the most used tag and the least used.
                var spread = maxCount - minCount;
                if (spread < 1) {
                    spread = 1
                }

                // The difference between the largest font and the smallest font
                var fontSpread = largest - smallest;
                // How much bigger the font will be for each tag count.
                var fontStep = fontSpread / spread;

                //Bucket logic
                for (var i = 0; i < buckets.length; i++) {
                    buckets[i].tagUrl = util.getSearchPage();
                    buckets[i].title = buckets[i].docCount + ((buckets[i].docCount > 1) ? ' topics' : ' topic');
                    var fontSize = smallest + (buckets[i].docCount - minCount) * fontStep;
                    buckets[i].font = 'font-size: ' + fontSize + 'pt;';
                }
            }
        }

        return buckets;
    }



    //stk.log(params.aggregations);



    var view = resolve('search-result.html');
    return stk.view.render(view, params);
};



var getQuery = function(up, folderPath, categories, header, site) {
    // Default query
    //var query = '_parentPath="/content' + folderPath + '" AND data.slideshow != "true"';
    var query = '';


    //Search filter
    if (up.s) {
        //query = 'fulltext("data.post", "' + up.s + '", "AND") OR fulltext("data.title", "' + up.s + '", "AND")';
        query += 'fulltext("_allText", "' + up.s + '", "AND")';
        header.headerText = 'Search Results for: ' + up.s;
    }

    // Filter for tags
    if (up.tag) {
        if (query) {
            query += ' AND ';
        }
        query += 'data.tags LIKE "' + up.tag.toLowerCase() + '"';
        header.headerText = 'Tag Archives: ' + up.tag;
    }

    //Filter for categories.
    if (up.cat) {

        if (query) {
            query += ' AND ';
        }

        up.cat = stk.data.forceArray(up.cat);
        //log.info('STK log %s', categories);

        query += 'data.category IN (';

        up.cat.forEach(function(item, index, array) {

            //var category = util.getCategory({name: item}, categories);

            //query += '"' + category._id + '"';

            query += '"' + item + '"';

            if (index !== array.length - 1){
                query += ',';
            }

        });

        query += ')';


        //query = 'data.category IN ("' + category._id + '")';
        //header.headerText = 'Category Archives: ' + category.displayName;
    }

    //Filter for content types.
    if (up.cty) {
        var contentTypePrefix = app.name + ':';

        if (query) {
            query += ' AND ';
        }

        up.cty = stk.data.forceArray(up.cty);

        query += 'type IN (';

        up.cty.forEach(function(item, index, array) {


            query += '"' + contentTypePrefix + item + '"';

            if (index !== array.length - 1){
                query += ',';
            }

        });

        query += ')';



        //query = 'type = "' + contentType + '"';
        //header.headerText = 'Content Type Archives: ' + '';
    }

    //Filter for authors
    if (up.author) {

        if (query) {
            query += ' AND ';
        }

        up.author = stk.data.forceArray(up.author);

        /*var authorResult = contentLib.query({
            count: 1,
            query: '_name LIKE "' + up.author + '"',
            contentTypes: [app.name + ':author']
        });
        var authorContent = authorResult.hits[0];*/

        //query += authorContent ? 'data.author LIKE "' + authorContent._id + '"' : 'data.author LIKE "0"';

        query += 'data.author IN (';

        up.author.forEach(function(item, index, array) {

            //var category = util.getCategory({name: item}, categories);

            query += '"' + item + '"';

            if (index !== array.length - 1){
                query += ',';
            }

        });

        query += ')';

        //stk.log(query);




        /*if (authorContent) {
            var authUrl = portal.pageUrl({
                path: stk.content.getPath(site._path),
                params: { author: up.author }
            });
            header.headerText = 'Author Archives: <span class="vcard"><a href="' + authUrl + '" class="url fn n">' + authorContent.data.name + '</a></span>'
        } else {
            header.headerText = 'Author Archives: ' + up.author + ' not found';
        }*/
    }

    //Filter for monthly archives
    if (up.m) {

        if (query) {
            query += ' AND ';
        }

        up.m = stk.data.forceArray(up.m);

        query += '(';

        up.m.forEach(function(item, index, array) {

            if (stk.data.isInt(item) && item.length == 6) {

                var year = item.substring(0,4); //Get the year from the querystring
                var month = item.substring(4,6); //Get the month from the querystring

                // Get the last day of the month for the content query
                var date = new Date(year, month, 0);
                var lastDay = date.getDate();

                var first = year + '-' + month + '-01T00:00:00Z';
                var last = year + '-' + month + '-' + lastDay + 'T23:59:59Z';

                query += 'createdTime > instant("' + first + '") AND createdTime < instant("' + last + '")';

                if (index !== array.length - 1){
                    query += ' OR ';
                }

            }


        });

        query += ')';



        // Get the last day of the month for the content query
        //var date = new Date(year, month, 0);
        //var lastDay = date.getDate();

        //var first = year + '-' + month + '-01T00:00:00Z';
        //var last = year + '-' + month + '-' + lastDay + 'T23:59:59Z';

        //query = '_parentPath="/content' + folderPath + '" AND createdTime > instant("' + first + '") AND createdTime < instant("' + last + '")';

        //var monthName = util.getMonthName(date);
        //header.headerText = 'Monthly Archives: ' + monthName + ' ' + year;
    }





    /*if (up.m && stk.data.isInt(up.m) && up.m.length == 6) {

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
    }*/
    return query;
};


// Used for cloning objects and not only pass by reference
function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}