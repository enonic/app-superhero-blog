const portal = require("/lib/xp/portal");
const contentLib = require("/lib/xp/content");
const thymeleaf = require("/lib/thymeleaf");
const commentLib = require("/lib/comments");
const auth = require("/lib/xp/auth");
const i18nLib = require('/lib/xp/i18n');
const assetUrlCache = require('/lib/assetUrlCache');

const view = resolve("comment-field.html");

const DASHED_APP_NAME = app.name.replace(/\./g, "-");

function localize(key, locale) {
    const obj = {
        key: key,
    };
    if (locale) {
        obj.locale = locale;
    }

    return i18nLib.localize(obj);
}


//TODO rename comment-field to something better
exports.get = function (request) {

    const portalContent = portal.getContent();

    const content = contentLib.get({ key: portalContent._id });
    let langCode = content.language;

    const component = portal.getComponent();

    //Lang code is wrongly formated (sometimes)
    langCode = langCode ? langCode.replace(/_/g, '-') : "";


    const site = portal.getSite();
    const siteCommon = site.x[DASHED_APP_NAME].siteCommon;
    const commentSort = siteCommon.commentSort || 'DESC';

    const discussion = commentLib.getComments(portalContent._id, commentSort);

    const elementId = "discussion"
    const model = {
        elementId: elementId,
        discussion: discussion,
        hasComments: discussion && Object.keys(discussion).length > 0,
        currentContent: content._id,
        componentUrl: `${request.path}/_/component${component.path}`,
        userId: (auth.getUser() || {}).key,
        locale: {
            reply: localize("comments.replyMessage"),
            newComment: localize("comments.newComment", langCode),
            edit: localize("comments.edit", langCode),
            post: localize("comments.post", langCode),
            close: localize("comments.close", langCode),
            commentsHeading: localize("comments.commentsHeading", langCode),
        },
    };

    model.render = !content.data.commentRemove;

    const assetUrls = assetUrlCache.getAssetUrls(request.mode, request.branch);

    return {
        body: thymeleaf.render(view, model),
        pageContributions: {
            headEnd: [
                `<script src="${assetUrls.jqueryJs}"></script>`,
            ],
            bodyEnd: [
               `
                <script data-th-inline="text">
                    window.discussionData = {
                        elementId: '${elementId}',
                        // componentUrl: '${request.path}/_/component${component.path}'
                    };
                </script>`,
                `<script src="${assetUrls.commentsJs}"></script>`,
            ]
        }
    };
};



exports.post = function(req) {
    const params = req.params;

    let comment = null;
    try {
        if (params.parent) {
            comment = commentLib.createComment(params.comment, params.content, params.parent);
        } else if (params.modify) {
            comment = commentLib.modifyComment(params.id, params.comment);
        } else {
            comment = commentLib.createComment(params.comment, params.content);
        }

    } catch (e) {
        if (typeof e === 'object' && e.status && e.message) {
            return getBadPostResponse(`Could not create/modify comment (${e.status}: ${e.message})`, e.status, e.message, req);
        }
    }
    if (!comment) {
        return getBadPostResponse("Could not create/modify comment.", 500, "Error is logged on the server", req);
    }


    const nodeData = commentLib.getNodeData(comment);

    let response = {};
    try {
        // Re-rendering the part's HTML after the POST has been handled:
        response = exports.get(req);

        if (typeof (response || {}).body === 'string') {
            response.contentType = 'text/html';
            if (nodeData._id) {
                response.body += `<script>markNewComment('${nodeData._id}');</script>`
            }
            return response;

        } else {
            return getBadRefreshResponse("Unexpected: it seems a comment node was successfully added/modified, but when refreshing the comment tree, empty response.body data was found.", req, response, nodeData);
        }

    } catch (e) {
        return getBadRefreshResponse("Error happened during comment-tree refresh, after adding/modifying a comment node:", req, nodeData, response, e);
    }
}

// Log a failed attempt at POSTing a new/modified comment, and return an appropriate response object
function getBadPostResponse(serverMessage, status, responseBody, request) {
    log.warning(serverMessage);
    log.warning("Request: " + JSON.stringify(request));
    return {
        status: status,
        contentType: 'text/plain',
        body: "Comment not created/modified: " + responseBody
    };
}


// Log a failed attempt at GETing the updated comment tree after a (successful) new/modified comment, and return an appropriate response object:
function getBadRefreshResponse(serverMessage, req, nodeData, response, e) {
    if (e) {
        log.error(e);
    }
    log.warning(serverMessage);
    log.warning("Request: " + JSON.stringify(req));
    log.warning("Added/modified comment node data: " + JSON.stringify(nodeData));
    log.warning("Generated response from .get: " + JSON.stringify(response));

    let message = "Error refreshing comment list, after a comment was apparently succesfully added/modified.";
    if (nodeData) {
        nodeData.__errormessage__ = message;
    }

    return {
        status:  nodeData
            ? 200
            : 500,
        contentType: nodeData
            ? 'application/json'
            : 'text/plain',
        body: nodeData
            ? nodeData
            : message
    }
}
