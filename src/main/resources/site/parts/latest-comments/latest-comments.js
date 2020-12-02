const thymeleaf = require("/lib/thymeleaf");
const commentLib = require("/lib/comments");
const contentLib = require("/lib/xp/content");
const nodeLib = require('/lib/xp/node');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
//const tools = require('/lib/tools');

exports.get = function (req) {
    const content = portal.getComponent();

    const siteContent = portal.getContent();

    const size = content.config.size;
    const headline = content.config.headline;

    let langCode = siteContent.language;
    if (langCode)
        langCode = langCode.replace(/_/g, '-'); //replace all underscore with dash

    const connection = nodeLib.connect({
        repoId: commentLib.REPO_ID,
        branch: "master",
    });

    //query the latest comments here
    const result = connection.query({
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

    const comments = [];

    for (let i = 0; i < result.hits.length; i++) {
        const commentId = result.hits[i].id;
        const node = connection.get(commentId);

        const nodeContext = contentLib.get({ key: node.content });
        //If content is deleted we cant use it.
        if (!nodeContext) {
            comments[i] = null;
            break;
        }
        comments[i] = commentLib.getNodeData(node);
        comments[i].contentUrl = portal.pageUrl({ id: node.content });
        comments[i].contentName = contentLib.get({ key: node.content }).displayName;
    }

    const model = {
        comments: comments,
        headline: headline,
        local: {
            on: i18n.localize({key: "comments.on", local: langCode })
        },
    };

    const view = resolve("latest-comments.html");

    const addition = [];
    const siteConfig = portal.getSiteConfig();

    if (siteConfig.commentsStyle) {
        addition.push("<link rel='stylesheet' href='" + portal.assetUrl({ path: "css/comments.css" }) + "'/>");
    }

    return {
        body: thymeleaf.render(view, model),
        pageContributions: {
            headEnd: addition,
        }
    };
};
