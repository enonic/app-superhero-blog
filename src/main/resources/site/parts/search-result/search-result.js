const stk = require('/lib/stk/stk');
const util = require('/lib/utilities');

const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');

exports.get = function(req) {

    const component = portal.getComponent();
    const config = component.config;
    const up = req.params; // URL params
    const content = portal.getContent();
    const site = portal.getSite();
    const postsPerPage = 100; // siteConfig.numPosts ? siteConfig.numPosts : 10;
    let newer = null, older = null; // For pagination
    const posts = [];
    const folderPath = util.postsFolder(config.contentFolder);
    const searchPage = util.getSearchPage();

    const categories = util.getCategories();

    const start = stk.data.isInt(up.paged) ? (up.paged - 1) * postsPerPage : 0;
    const header = {};
    const query = getQuery(up, folderPath, categories, header, site);

    // Only put sticky on top on the first page when there are no queries
    let orderBy = '';
    if (Object.keys(up).length == 0 || (Object.keys(up).length == 1 && up.paged)) {
        orderBy = 'data.stickyPost DESC, ';
    }
    orderBy += 'createdTime DESC';

    const results = contentLib.query({
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

    const hasPosts = results.hits.length > 0? true : false;

    const numMatches = results.total | 0;

    // If the results total is more than the postsPerPage then it will need pagination.
    if (results.total > postsPerPage) {

        // Must include other URL params in the pagination links.
        const urlParams = {};
        for(const param in up) {
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
    for (let i = 0; i < results.hits.length; i++) {
        const result = results.hits[i];
        const post = result.data;
        post.title = result.displayName;
        const categoriesArray = [];
        post.class = 'post-' + result._id + ' post type-post status-publish format-standard hentry';
        if (post.stickyPost && Object.keys(up).length == 0) {
            post.class += ' sticky';
        }

        if (result.createdTime) {
            const createdDate = new Date(
                // Recent versions of XP adds decimals at the end of the content creation date string.
                // These decimals are incompatible with "new Date" here (nashorn - although it works in node!) so remove them.
                result.createdTime.replace(/\.\d+(Z?)$/, "$1")
            );

            if (createdDate) {
                post.pubDatetime = JSON.stringify(createdDate);
                post.pubDate = util.getFormattedDate(createdDate);
            }
        }

        post.path = result._path;
        post.createdTime = result.createdTime;
        post.comments = contentLib.query({
            start: 0,
            count: 1000,
            query: "data.post = '" + result._id + "'",
            sort: 'createdTime DESC',
            contentTypes: [
                app.name + ':comment'
            ]
        });

        post.commentsText = post.comments.total == 0 ? 'Leave a comment' : post.comments.total + ' comment' + (+ post.comments.total > 1 ? 's' : '');

        post.author = post.author ?
            stk.content.get(post.author) :
            post.author;

        post.category = post.category ? stk.data.forceArray(post.category) : null;

        if (post.category) {
            for (let j = 0; j < post.category.length; j++) {
                if(post.category[j] && stk.content.exists(post.category[j])) {
                    const category = util.getCategory({id: post.category[j]}, categories);
                    categoriesArray.push(category);
                    post.class += ' category-' + category._name + ' ';
                }
            }
        }

        post.categories = categoriesArray.length > 0 ? categoriesArray : null

        if (post.featuredImage) {
            const img = stk.content.get(post.featuredImage);
            post.fImageName = img.displayName;
            post.fImageUrl = portal.imageUrl({
                id: post.featuredImage,
                scale: 'width(695)',
                format: 'jpeg'
            });
        }

        stk.data.deleteEmptyProperties(post);
        posts.push(post);
    }

    const model = {
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
        const aggregations = {
            date: getDateAggregation(),
            cty: getCtyAggregations(),
            author: getAuthorAggregations(),
            category: getCategoryAggregations()
        };

        return aggregations;
    }

    function getDateAggregation() {
        const relevantMonths = [];

        const urlParamsFiltered = clone(up);
        urlParamsFiltered.m = undefined;

        const result = contentLib.query({
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
                const monthParts = item.key.split('-');
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

        const urlParamsFiltered = clone(up);
        urlParamsFiltered.cty = undefined;

        const result = contentLib.query({
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

        const urlParamsFiltered = clone(up);
        urlParamsFiltered.author = undefined;

        const result = contentLib.query({
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
            const author = getAuthor(item.key);
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

        const urlParamsFiltered = clone(up);
        urlParamsFiltered.cat = undefined;

        const result = contentLib.query({
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
            const category = getCategory(item.key);
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

        const author = stk.content.get(id);

        return author;
    }

    function getCategory(id) {

        const category = stk.content.get(id);

        return category;
    }

    /*function getAggregations(contentType, searchTerm) {




        const result = contentLib.query({
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










        const aggregations = result.aggregations.contentTypes.buckets;


        /!**
         *
         * temp
         *!/

        const paginationCount = 10;
        const paginationStart = 0;
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
                url: portal.componentUrl({
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
        const result = contentLib.query({
            query: "ngram('displayName', '" + searchTerm + "', 'AND') ",
            count: count,
            start: start,
            contentTypes: contentTypes
        });



        return result.hits;
    }

    function getTags() {
        //const site = portal.getSite();

        // Get all posts that have one or more tags.
        const result = contentLib.query({
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

        let buckets = null;
        if (result && result.aggregations && result.aggregations.tags && result.aggregations.tags.buckets) {
            buckets = [];

            const results = result.aggregations.tags.buckets;

            // Prevent ghost tags from appearing in the part
            for (let i = 0; i < results.length; i++) {
                if (results[i].docCount > 0) {
                    buckets.push(results[i]);
                }
            }

            if (buckets.length > 0) {

                // Make the font sizes
                const smallest = 8;
                const largest = 22;

                //Get the max and min counts
                const newBucket = buckets.slice();
                newBucket.sort(function (a, b) {
                    return a.docCount - b.docCount;
                });
                const minCount = newBucket[0].docCount; // smallest number for any tag count
                const maxCount = newBucket[newBucket.length - 1].docCount; // largest number for any tag count

                // The difference between the most used tag and the least used.
                let spread = maxCount - minCount;
                if (spread < 1) {
                    spread = 1
                }

                // The difference between the largest font and the smallest font
                const fontSpread = largest - smallest;
                // How much bigger the font will be for each tag count.
                const fontStep = fontSpread / spread;

                //Bucket logic
                for (let i = 0; i < buckets.length; i++) {
                    buckets[i].tagUrl = util.getSearchPage();
                    buckets[i].title = buckets[i].docCount + ((buckets[i].docCount > 1) ? ' topics' : ' topic');
                    const fontSize = smallest + (buckets[i].docCount - minCount) * fontStep;
                    buckets[i].font = 'font-size: ' + fontSize + 'pt;';
                }
            }
        }

        return buckets;
    }



    //stk.log(params.aggregations);



    const view = resolve('search-result.html');
    return stk.view.render(view, model);
};



const getQuery = function(up, folderPath, categories, header, site) {
    // Default query
    //const query = '_parentPath="/content' + folderPath + '" AND data.slideshow != "true"';
    let query = '';

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

            //const category = util.getCategory({name: item}, categories);

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
        const contentTypePrefix = app.name + ':';

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

        /*const authorResult = contentLib.query({
            count: 1,
            query: '_name LIKE "' + up.author + '"',
            contentTypes: [app.name + ':author']
        });
        const authorContent = authorResult.hits[0];*/

        //query += authorContent ? 'data.author LIKE "' + authorContent._id + '"' : 'data.author LIKE "0"';

        query += 'data.author IN (';

        up.author.forEach(function(item, index, array) {

            //const category = util.getCategory({name: item}, categories);

            query += '"' + item + '"';

            if (index !== array.length - 1){
                query += ',';
            }

        });

        query += ')';

        //stk.log(query);




        /*if (authorContent) {
            const authUrl = portal.pageUrl({
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

                const year = item.substring(0,4); //Get the year from the querystring
                const month = item.substring(4,6); //Get the month from the querystring

                // Get the last day of the month for the content query
                const date = new Date(year, month, 0);
                const lastDay = date.getDate();

                const first = year + '-' + month + '-01T00:00:00Z';
                const last = year + '-' + month + '-' + lastDay + 'T23:59:59Z';

                query += 'createdTime > instant("' + first + '") AND createdTime < instant("' + last + '")';

                if (index !== array.length - 1){
                    query += ' OR ';
                }

            }


        });

        query += ')';



        // Get the last day of the month for the content query
        //const date = new Date(year, month, 0);
        //const lastDay = date.getDate();

        //const first = year + '-' + month + '-01T00:00:00Z';
        //const last = year + '-' + month + '-' + lastDay + 'T23:59:59Z';

        //query = '_parentPath="/content' + folderPath + '" AND createdTime > instant("' + first + '") AND createdTime < instant("' + last + '")';

        //const monthName = util.getMonthName(date);
        //header.headerText = 'Monthly Archives: ' + monthName + ' ' + year;
    }





    /*if (up.m && stk.data.isInt(up.m) && up.m.length == 6) {

        const year = up.m.substring(0,4); //Get the year from the querystring
        const month = up.m.substring(4,6); //Get the month from the querystring

        // Get the last day of the month for the content query
        const date = new Date(year, month, 0);
        const lastDay = date.getDate();

        const first = year + '-' + month + '-01T00:00:00Z';
        const last = year + '-' + month + '-' + lastDay + 'T23:59:59Z';

        query = '_parentPath="/content' + folderPath + '" AND createdTime > instant("' + first + '") AND createdTime < instant("' + last + '")';

        const monthName = util.getMonthName(date);
        header.headerText = 'Monthly Archives: ' + monthName + ' ' + year;
    }*/
    return query;
};


// Used for cloning objects and not only pass by reference
function clone(obj) {
    let copy;

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
        for (let i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (const attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}
