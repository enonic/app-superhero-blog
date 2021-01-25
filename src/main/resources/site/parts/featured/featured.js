const thymeleaf = require('/lib/thymeleaf');
const dataUtils = require('/lib/data');
const util = require('/lib/utilities');

const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');

const view = resolve('featured.html');

function makeSlides(hits) {
    const slides = [];
    for (let i = 0; i < hits.length; i++) {
        const content = hits[i];
        const data = content.data;
        const slide = {};
        const imgUrl = portal.imageUrl({
            id: data.featuredImage,
            scale: 'block(1024,355)'
        });

        slide.id = content._id;
        slide.name = content.displayName;
        slide.url = portal.pageUrl({path: content._path});
        slide.imageUrl = imgUrl;

        slides.push(slide);
    }
    return slides;
}


function getSlideshowPosts() {
    const query = '_parentPath="/content' + util.getPostsFolder() + '" AND data.featuredImage != "" AND data.slideshow = "true"';
    const orderBy = 'createdTime DESC';

    const results = contentLib.query({
        start: 0,
        count: 10,
        query: query,
        sort: orderBy,
        contentTypes: [
            app.name + ':post'
        ]
    });

    return removeInvalidPosts(results.hits);
}


function getConfigPosts(postIDs) {
    if(!postIDs) {
        return null;
    }

    const query = '_id IN (' +
        JSON.stringify(dataUtils.forceArray(postIDs))
            .replace('[','')
            .replace(']','') +
        ')';

    const results = contentLib.query({
        start: 0,
        count: 10,
        query: query,
        contentTypes: [app.name + ':post']
    });

    return removeInvalidPosts(results.hits);
}


function removeInvalidPosts(posts) {
    const postsArray = dataUtils.forceArray(posts);
    const hits = [];
    for (let i = 0; i < postsArray.length; i++) {
        if(postsArray[i].data.featuredImage) {
            hits.push(postsArray[i]);
        }
    }
    return hits ? hits : null;
}



exports.get = function handleGet(req) {
    const component = portal.getComponent();
    const config = component.config;

    const featuredPosts = config.posts
        ? getConfigPosts(config.posts)
        : getSlideshowPosts();

    const model = {
        slides: makeSlides(featuredPosts),
        editMode: req.mode === 'edit'
    }

    return {
        body: thymeleaf.render(view, model)
    };
}
