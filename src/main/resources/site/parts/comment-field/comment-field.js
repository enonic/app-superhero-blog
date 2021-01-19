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
        serviceUrl: portal.serviceUrl({
            service: "comments",
        }),
        userId: (auth.getUser() || {}).key,
        locale: {
            reply: localize("comments.replyMessage"),
            newComment: localize("comments.newComment", langCode),
            edit: localize("comments.edit", langCode),
            post: localize("comments.post", langCode),
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
                        componentUrl: '${request.path}/_/component${component.path}'
                    };
                </script>`,
                `<script src="${assetUrls.commentPostJs}"></script>`,
            ]
        }
    };
};
