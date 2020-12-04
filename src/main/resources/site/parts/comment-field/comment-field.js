const portal = require("/lib/xp/portal");
const contentLib = require("/lib/xp/content");
const thymeleaf = require("/lib/thymeleaf");
const commentLib = require("/lib/comments");
const auth = require("/lib/xp/auth");
const i18nLib = require('/lib/xp/i18n');

const view = resolve("comment-field.html");


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
exports.get = function (ref) {
    const portalContent = portal.getContent();

    const content = contentLib.get({ key: portalContent._id });
    let langCode = content.language;

    //Lang code is wrongly formated (sometimes)
    langCode = langCode ? langCode.replace(/_/g, '-') : "";

    const discussion = commentLib.getComments(portalContent._id);

    const model = {
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

    return {
        body: thymeleaf.render(view, model),
        pageContributions: {
            headEnd: [
                `<script src="${portal.assetUrl({ path: "js/lib/jquery-3.3.1.min.js" })}"></script>`,
            ],
            bodyEnd: [
                `<script src="${portal.assetUrl({ path: "js/comment-post.js" })}"></script>`,
            ]
        }
    };
};
