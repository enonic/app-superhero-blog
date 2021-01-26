const thymeleaf = require("/lib/thymeleaf");
const commentLib = require("/lib/comments");
const contentLib = require("/lib/xp/content");
const nodeLib = require('/lib/xp/node');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
//const tools = require('/lib/tools');

const DEFAULTS = {
    size: 5,
    headline: "Latest comments"
};


/**
 *   Extract and format comment nodes where that comment has a parent content (i.e. a post)
 *   that exists / is not deleted (in which case contentLib.get would return null)
 *   into an array of comment objects:
 */
function extractComments(commentNodes) {
    const comments = []
    for (let j = 0; j< commentNodes.length; j++) {
        const commentNode = commentNodes[j];

        const parent = contentLib.get({
            // Extra safeguard: if commentNode is missing/empty, parent will just become null and be filtered out below:
            key: (commentNode || {}).content
        });

        if (parent) {
            // By now, we know the comment node is usable.
            // Extract and format data from it, and push that comment object into the usableComments array:
            const comment = commentLib.getNodeData(commentNode);
            comment.contentUrl = portal.pageUrl({ id: commentNode.content });
            comment.contentName = parent.displayName;
            comments.push(comment);
        }
    }

    return comments;
}


/**
 * Use the node API to query the comments repo for raw data of the latest comments on the entire site.
 */
function queryCommentNodes(size) {
    const commentRepo = nodeLib.connect({
        repoId: commentLib.REPO_ID,
        branch: "master",
        principals: ["role:system.admin"],
    });

    // query: IDs of the latest comments:
    const result = commentRepo.query({
        start: 0,
        count: size,
        query: "",
        sort: 'creationTime DESC',
        branch: "master",
        filters: {
            boolean: {
                must: [
                    {
                        exists: {
                            field: "type",
                            values: ["comment"],
                        }
                    },
                    {
                        exists: {
                            field: "content",
                        }
                    }
                ],
            },
        },
    });

    // Gather the found comment IDs in one array:
    const commentIds = [];
    for (let i = 0; i < result.hits.length; i++) {
        commentIds.push(result.hits[i].id);
    }

    // query: fetch their comment data nodes with one query (ID-array argument is faster than many single queries),
    return commentRepo.get(commentIds);
}


exports.get = function (req) {
    const content = portal.getComponent();

    const siteContent = portal.getContent();

    const size = content.config.size || DEFAULTS.size;
    const headline = ((content.config.headline || '') + '').trim() || DEFAULTS.headline;

    let langCode = siteContent.language;
    if (langCode)
        langCode = langCode.replace(/_/g, '-'); //replace all underscore with dash

    const queryResult = queryCommentNodes(size);
    const commentNodes = (!Array.isArray(queryResult))
        ? [queryResult]
        : queryResult;

    const comments = extractComments(commentNodes);

    const model = {
        hasComments: comments.length > 0,
        comments: comments,
        headline: headline,
        local: {
            on: i18n.localize({key: "comments.on", local: langCode })
        },
    };

    const view = resolve("latest-comments.html");

    return {
        body: thymeleaf.render(view, model)
    };
};
