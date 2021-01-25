const thymeleaf = require('/lib/thymeleaf');
const dataUtils = require('/lib/data');
const contentUtils = require('/lib/content');
const util = require('/lib/utilities');

const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');

const view = resolve('post-list.html');


function getQuery(up, folderPath, categories, header, site) {
    // Default query
    let query = '_parentPath="/content' + folderPath + '" AND data.slideshow != "true"';

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
        log.info('Categories: %s', categories);

        const category = util.getCategory({name: up.cat}, categories);
        query = 'data.category IN ("' + category._id + '")';
        header.headerText = 'Category Archives: ' + category.displayName;
    }

    //Filter for authors
    if (up.author) {
        const authorResult = contentLib.query({
            count: 1,
            query: '_name LIKE "' + up.author + '"',
            contentTypes: [app.name + ':author']
        });
        const authorContent = authorResult.hits[0];

        query = authorContent ? 'data.author LIKE "' + authorContent._id + '"' : 'data.author LIKE "0"';

        if (authorContent) {
            const authUrl = portal.pageUrl({
                path: contentUtils.getPath(site._path),
                params: { author: up.author }
            });
            header.headerText = 'Author Archives: <span class="vcard"><a href="' + authUrl + '" class="url fn n">' + authorContent.data.name + '</a></span>'
        } else {
            header.headerText = 'Author Archives: ' + up.author + ' not found';
        }
    }

    //Filter for monthly archives
    if (up.m && dataUtils.isInt(up.m) && up.m.length == 6) {

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
    }
    return query;
};




exports.get = function(req) {
    const site = portal.getSite();

    const params = req.params; // URL params
    const content = portal.getContent();

    const siteConfig = portal.getSiteConfig();
    const postsPerPage = siteConfig.numPosts ? siteConfig.numPosts : 10;
    let newer = null, older = null; // For pagination
    const posts = [];
    const folderPath = util.getPostsFolder();
    const searchPage = util.getSearchPage();

    const categories = util.getCategories();

    const start = dataUtils.isInt(params.paged) ? (params.paged - 1) * postsPerPage : 0;
    const header = {};

    const query = getQuery(params, folderPath, categories, header, site);

    // Only put sticky on top on the first page when there are no queries
    let orderBy = '';
    if (Object.keys(params).length == 0 || (Object.keys(params).length == 1 && params.paged)) {
        orderBy = 'data.stickyPost DESC, ';
    }
    orderBy += 'createdTime DESC';

    const results = contentLib.query({
        start: start,
        count: postsPerPage,
        query: query,
        sort: orderBy,
        contentTypes: [
            app.name + ':post'
        ]
    });

    const hasPosts = results.hits.length > 0? true : false;

    // If the results total is more than the postsPerPage then it will need pagination.
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
            urlParams.paged = dataUtils.isInt(params.paged) ? (parseInt(params.paged) + 1).toString() : 2;
            older = portal.pageUrl({
                path: content._path == searchPage ? searchPage : site._path,
                params: urlParams
            });
        }
        // Needs a "newer" link if...
        if (start != 0) {

            if(dataUtils.isInt(params.paged) && params.paged > 2) {
                urlParams.paged = (parseInt(params.paged) - 1).toString();
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
        if (post.stickyPost && Object.keys(params).length == 0) {
            post.class += ' sticky';
        }

        post.path = result._path;

        post.comments = contentLib.query({
            start: 0,
            count: 1000,
            query: "data.post = '" + result._id + "'",
            sort: 'createdTime DESC',
            contentTypes: [
                app.name + ':comment'
            ]
        });

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

        post.commentsText = post.comments.total == 0 ? 'Leave a comment' : post.comments.total + ' comment' + (+ post.comments.total > 1 ? 's' : '');

        post.author = contentUtils.get(post.author);


        post.category = post.category ? dataUtils.forceArray(post.category) : null;

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

    const model = {
        posts: posts,
        site: site,
        searchPage: searchPage,
        older: older,
        newer: newer,
        headerText: header.headerText,
        hasPosts: hasPosts
    }

    return {
        body: thymeleaf.render(view, model)
    };
};


