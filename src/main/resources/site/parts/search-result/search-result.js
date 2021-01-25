var thymeleaf = require('/lib/thymeleaf');
const dataUtils = require('/lib/data');
const contentUtils = require('/lib/content');
const util = require('/lib/utilities');

const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');

const view = resolve('search-result.html');




function getDateAggregation(params, folderPath, categories, header, site) {
    const relevantMonths = [];

    const urlParamsFiltered = clone(params);
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


            if (params.m && params.m.indexOf(item.month) !== -1) {
                item.checked = true;
            }

        }
    });

    return relevantMonths;
}





function getCtyAggregations(params, folderPath, categories, header, site) {

    const urlParamsFiltered = clone(params);
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

        if (params.cty && params.cty.indexOf(item.shortName) !== -1) {
            item.checked = true;
        }
    });

    return result.aggregations.cty.buckets;
}





function getAuthorAggregations(params, folderPath, categories, header, site) {

    const urlParamsFiltered = clone(params);
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
        const author = contentUtils.get(item.key);
        item.displayName = author.displayName;
        item.name = author._name;

        item.docCount = item.docCount | 0;

        if (params.author && params.author.indexOf(item.key) !== -1) {
            item.checked = true;
        }
    });

    return result.aggregations.authors.buckets;
}





function getCategoryAggregations(params, folderPath, categories, header, site) {

    const urlParamsFiltered = clone(params);
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
        const category = contentUtils.get(item.key);
        item.displayName = category.displayName;
        item.name = category._name;

        item.docCount = item.docCount | 0;

        if (params.cat && params.cat.indexOf(item.key) !== -1) {
            item.checked = true;
        }


    });

    return result.aggregations.categories.buckets;
}



function getPosts(results, params, categories) {
    // Loop through the posts and get the comments, categories and author
    const posts = [];
    for (let i = 0; i < results.hits.length; i++) {
        const result = results.hits[i];
        const post = result.data;
        post.title = result.displayName;
        post.class = 'post-' + result._id + ' post type-post status-publish format-standard hentry';
        if (post.stickyPost && Object.keys(params).length == 0) {
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
            contentUtils.get(post.author) :
            post.author;

        post.category = post.category
            ? dataUtils.forceArray(post.category)
            : null;

        const categoriesArray = [];
        if (post.category) {
            for (let j = 0; j < post.category.length; j++) {
                if(post.category[j] && contentUtils.exists(post.category[j])) {
                    const category = util.getCategory({id: post.category[j]}, categories);
                    categoriesArray.push(category);
                    post.class += ' category-' + category._name + ' ';
                }
            }
        }

        post.categories = categoriesArray.length > 0 ? categoriesArray : null

        if (post.featuredImage) {
            const img = contentUtils.get(post.featuredImage);

            post.fImageName = img.displayName;

            post.fImageUrl = portal.imageUrl({
                id: post.featuredImage,
                scale: 'width(695)',
                format: 'jpeg'
            });
        }

        dataUtils.deleteEmptyProperties(post);
        posts.push(post);
    }

    return posts;
}



// If the results total is more than the postsPerPage then it will need pagination.
function paginate(results, params, content, site, start, postsPerPage, searchPage) {
    let newer = null;
    let older = null;

    if (results.total > postsPerPage) {
        // Must include other URL params in the pagination links.
        const urlParams = {};
        for(const param in params) {
            if (param != 'paged') {
                urlParams[param] = params[param];
            }
        }

        // Needs an "older" link if...
        if (start < (results.total - postsPerPage)) {
            urlParams.paged = dataUtils.isInt(params.paged)
                ? (parseInt(params.paged) + 1).toString()
                : 2;
            older = portal.pageUrl({
                path: content._path === searchPage
                    ? searchPage
                    : site._path,
                params: urlParams
            });
        }
        // Needs a "newer" link if...
        if (start !== 0) {
            if(dataUtils.isInt(params.paged) && params.paged > 2) {
                urlParams.paged = (parseInt(params.paged) - 1).toString();
            } else {
                urlParams.paged = null;
            }

            newer = portal.pageUrl({
                path: content._path === searchPage
                    ? searchPage
                    : site._path,
                params: urlParams
            });
        }
    }

    return {
        newer: newer,
        older: older
    };
}




function getTags(params, folderPath, categories, header, site) {
    //const site = portal.getSite();

    // Get all posts that have one or more tags.
    const result = contentLib.query({
        start: 0,
        count: 0,
        //query: "_path LIKE '/content" + site._path + "/*'", // Only get tags from this site.
        query: getQuery(params, folderPath, categories, header, site),
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

        up.cat = dataUtils.forceArray(up.cat);

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

        up.cty = dataUtils.forceArray(up.cty);

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

        up.author = dataUtils.forceArray(up.author);

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




        /*if (authorContent) {
            const authUrl = portal.pageUrl({
                path: contentUtils.getPath(site._path),
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

        up.m = dataUtils.forceArray(up.m);

        query += '(';

        up.m.forEach(function(item, index, array) {

            if (dataUtils.isInt(item) && item.length == 6) {

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





    /*if (up.m && dataUtils.isInt(up.m) && up.m.length == 6) {

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






exports.get = function(req) {
    const params = req.params; // URL params
    const content = portal.getContent();
    const site = portal.getSite();
    const postsPerPage = 100; // siteConfig.numPosts ? siteConfig.numPosts : 10;
    const folderPath = util.getPostsFolder();
    const searchPage = util.getSearchPage();

    const categories = util.getCategories();

    const start = dataUtils.isInt(params.paged)
        ? (params.paged - 1) * postsPerPage
        : 0;
    const header = {};


    // Only put sticky on top on the first page when there are no queries
    let orderBy = '';
    if (Object.keys(params).length == 0 || (Object.keys(params).length == 1 && params.paged)) {
        orderBy = 'data.stickyPost DESC, ';
    }
    orderBy += 'createdTime DESC';

    const query = getQuery(params, folderPath, categories, header, site);
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

    const pagination = paginate(results, params, content, site, start, postsPerPage, searchPage);

    const model = {
        posts: getPosts(results, params, categories),
        site: site,
        searchPage: searchPage,
        newer: pagination.newer,
        older: pagination.older,
        headerText: header.headerText,
        hasPosts: results.hits.length > 0,
        numMatches: results.total | 0,
        searchTerm: params.s,
        aggregations: {
            date: getDateAggregation(params, folderPath, categories, header, site),
            cty: getCtyAggregations(params, folderPath, categories, header, site),
            author: getAuthorAggregations(params, folderPath, categories, header, site),
            category: getCategoryAggregations(params, folderPath, categories, header, site)
        },
        componentUrl: portal.componentUrl({}),
        pageUrl: portal.pageUrl({}),
        urlParams: params,
        tags: getTags(params, folderPath, categories, header, site)
    };

    return {
        body: thymeleaf.render(view, model)
    };
};

