const contentLib = require('/lib/xp/content');
const nodeLib = require('/lib/xp/node');
const authLib = require('/lib/xp/auth');
const repoLib = require('/lib/xp/repo');

exports.createComment = createComment;
exports.modifyComment = modifyComment;
exports.getNodeData = getNodeData;
exports.getComments = getComments;
exports.getComment = getComment;
exports.getConnection = getConnection;
exports.createRepo = createRepo;
exports.initializeRepo = initializeRepo;
//exports.createTestComments = createTestComments;


const ROLE_POSTCOMMENT = "role:postcomment";
const ROLE_SYSAUTH = "role:system.authenticated";
const ROLE_SYSADMIN =  "role:system.admin";

const REPO_ID = `${app.name}.comments`;
exports.REPO_ID = REPO_ID;
/**
 * Permission getter so it can be reused.
 * @return {Array} permission array
 */
function getPermissions() {
    return [
        {
            principal: ROLE_POSTCOMMENT,
            allow: [
                "READ",
                "CREATE",
                "MODIFY",
                "DELETE",
                "PUBLISH",
            ],
            deny: [],
        },
        {
            principal: ROLE_SYSAUTH,
            allow: [
                "READ",
                "CREATE",
                "MODIFY",
                "DELETE",
                "PUBLISH",
            ],
            deny: [],
        },
        {
            principal: ROLE_SYSADMIN,
            allow: [
                "READ",
                "CREATE",
                "MODIFY",
                "DELETE",
                "PUBLISH",
                "READ_PERMISSIONS",
                "WRITE_PERMISSIONS"
            ],
            deny: [],
        },
    ];
}

/**
 * Creates a new repo for this application
 * @returns {RepoConnection}
 */
function createRepo() {
    const repoConnection = repoLib.create({
        id: REPO_ID,
        rootPermissions: getPermissions(),
        rootChildOrder: "_timestamp ASC",
    });

    if (typeof repoConnection.id === "undefined") {
        log.error(`Could not create repo connection: ${REPO_ID}`);
        return false;
    }

    return true;
}

/**
 * Tried to connect to a repo, creates it if it cant find it.
 * @returns {repoConnection}
 */
function getConnection() {

    const admin = authLib.hasRole(ROLE_SYSADMIN);
    //You need admin acces to see if repo exists... sigh
    if (admin) {
        repoLib.get(REPO_ID) || createRepo();
    }

    const connection = nodeLib.connect({
        repoId: REPO_ID,
        branch: "master",
        principals: [ROLE_SYSADMIN],
    });

    //Updating permissions if they are outdated
    if (admin) {
        const permissions = getPermissions();
        const root = connection.get('000-000-000-000');
        //v1.1.2 has 2 permissions (default)
        //V1.2.0 has 3 permissions soo this updates it (hopefully)
        if (root._permissions.length != permissions.length) {
            log.info(`Updating permissions on ${REPO_ID}`);
            connection.setRootPermissions({
                _permissions: permissions,
            });
        }
    }

    return connection;
}

/**
 * Creates a new comment, assumes the current content is set.
 * @param {string} comment The comment of the new post
 * @param {string} contentId The node id the comment is attached to
 * @param {String} [parent] The parent node used as to set give a new child
 * @param {RepoConnection} [connection] Used to spesify what repo to use
 * @returns {Object} Repo node created or Null if failure
 */
function createComment(comment, contentId, parent, connection) {
    if (connection == null) {
        connection = getConnection();
    }

    const currentUser = authLib.getUser();
    if (currentUser == null) {
        log.info("No user found. Need to login to post comments");
        return null;
    }

    //Check if content exists
    const currentContent = contentLib.get({ key: contentId });
    if (!currentContent) {
        log.info("Got an contentId that does not exist");
        return null;
    } else if (!comment || comment.length === 0) {
        log.info("Posted an empty comment");
        return null;
    }

    //Emails in username fix. Removes from "<" to ">".
    const sanitizedName = currentUser.displayName.replace(/([<](.)*[>])/g, "");

    const now = new Date().toISOString();

    const commentModel = {
        _name: currentContent._name + "-" + now,
        _permissions: getPermissions(),
        content: contentId,
        type: "comment",
        creationTime: now,
        data: {
            comment: comment,
            userName: sanitizedName,
            userId: currentUser.key,
        },
    };

    if (parent != null) {
        const parentNode = connection.get(parent);
        if (typeof parentNode === 'undefined' || parentNode === null) {
            log.info("Cant find parent with id:" + parent);
            return null;
        }
        //Setting parentPath set nested
        commentModel._parentPath = parentNode._path;
        commentModel.parentId = parentNode._id;
    }

    const node = connection.create(commentModel);

    repoLib.refresh({
        repo: REPO_ID,
        branch: 'master'
    });

    return node;
}

/**
 * Used to set a new comment
 * @param {String} id Node repo id
 * @param {String} comment The new comment to use
 * @param {RepoConnection} [connection] Send in your own repo connection
 */
function modifyComment(id, commentEdit, connection) {
    if (connection == null) {
        connection = getConnection();
    }

    const user = authLib.getUser();
    if (user == null) {
        log.info("No user found! Probably user session ended");
        return null;
    }
    //Check if users are the same.
    const currentUserId = user.key;
    const commentUser = connection.get(id).data.userId;

    if (!commentUser) {
        log.info("Could not find userId on comment");
        return null;
    }
    else if (currentUserId !== commentUser) {
        log.info("Current user is different from the author!");
        return null;
    }

    const result = connection.modify({
        key: id,
        editor: function(node) {
            node.data.comment = commentEdit;
            return node;
        }
    });

    if (!result) {
        log.info("Could not change comment with id: " + id);
        return null;
    }

    repoLib.refresh({
        repo: REPO_ID,
        branch: 'master'
    });

    return result;
}


/**
 * Gets the values we need for rendering from a node.
 * @param {Object} node XP repo node
 * @returns {object}
 */
function getNodeData(node) {
    return {
        _id: node._id,
        userName: node.data.userName,
        text: node.data.comment,
        creationTime: node.creationTime,
        time: formatDate(node.creationTime),
        userId: node.data.userId,
        children: node.children
    };
}


/**
 * Helper for getComments. Checks if a comment parentNode has an array under a .children attribute (and if not, creates it),
 * and adds the childNode to the end of that array.
 * @param parentNode
 * @param childNode
 */
function addChildUnderNode(parentNode, childNode) {
    if (!parentNode.children) {
        parentNode.children = [];
    }
    parentNode.children.push(childNode);
}



/** Turns a comments search result (.hits list) into a hierarchy with only relevant-data comment objects, and reply objects
 *  under .children (which may also have children, etc).
 *  Keeps, and does not depend on, the order of comments in the results. */
function buildCommentHierarchy(commentNodes) {
    // The output to build: an a rray of top-level comment nodes.
    // These mutable objects will be the same as in "nodes" aboce.
    // Each will end up having an array of children (full nodes) under "children".
    const comments = [];

    // Temporary "registry" using an object instead of an array, to save iterations:
    // all nodes from the results as the data nodes are read from connection.get, by id -> node (saves iteration)
    const allFormattedNodes = {};

    // Temporary: node objects that haven't yet been placed under any "children" array in any other node.
    // Each node may or may not have children of its own during the processing.
    const pending = [];


    for (let i = 0; i < commentNodes.length; i++) {
        const node = commentNodes[i];
        const formattedNode = getNodeData(node);
        allFormattedNodes[node._id] = formattedNode;

        // If there's a parentId, insert the node under either it's parent's .children or under the pending list:
        if (typeof node.parentId !== "undefined" && node.parentId !== null) {
            const parentNode = allFormattedNodes[node.parentId];

            // Since we're iterating over result nodes whose order may vary depending on ASC or DESC (commentSort, from siteCommon.xml),
            // the parent may not have been read yet and not found in allFormattedNodes. In this case it's expected to be read later, so put it in the pending list.
            if (parentNode) {
                addChildUnderNode(parentNode, formattedNode);
            } else {
                pending.push(node);
            }

            // If no parentId, insert it at (the end of) the top level of the hierarchy:
        } else {
            comments.push(formattedNode);
        }
    }
    // INVARIANT ASSUMPTION: by the end of all items in the above for-loop, every node from results.hits are...
    // - all in allFormattedNodes (in ready-to-use data format of course), AND
    // - (
    //      EITHER in the comments array, in ready-to-use format,
    //      OR in the pending array, in raw node format.
    // ),
    // ...and every node in pending has a .parentId that matches the ._id of exactly one node in allFormattedNodes.


    // ...so by now, all that remains is to distribute each pending nodes into the .children of their parents:

    let parentNode, pendingNode, j;
    for (j=0; j<pending.length; j++) {
        pendingNode = pending[j];
        parentNode = allFormattedNodes[pendingNode.parentId];
        if (parentNode) {
            addChildUnderNode(parentNode, allFormattedNodes[pendingNode._id]);
        } else {
            log.warning("Couldn't find a parent for this comment. Skipping pending node: "
                + JSON.stringify(pendingNode));
            log.debug("Dumping context for missing parent comment - full comments search result (sorted by: creationTime " +
                (commentsSort || "ASC") +
                ") for post with content ID '" + contentId + "' are: "
                + JSON.stringify(result));
        }
    }

    return comments;
}



/**
 * //Gets the all comments from the given content.
 * @param {String} id repo node id
 * @param {RepoConnection} [repoConnection] sets the repo connection to use
 * @returns {Array} Array of objects in a hierarcy structure
 */
function getComments(contentId, commentsSort) {
    const connection = getConnection();

    //Could sort by creation time for faster lookup?
    //500+ should be handle by pagination.
    const result = connection.query({
        start: 0,
        count: 500,
        sort: "creationTime " + (commentsSort || "ASC"),
        query: "type='comment' AND content='" + contentId + "'",
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
                            values: [contentId]
                        }
                    }
                ],
            },
        },
    });

    const hitIds = [];
    for (let i = 0; i < result.hits.length; i++) {
        hitIds.push(result.hits[i].id);
    }
    const commentNodes = connection.get(hitIds);

    return buildCommentHierarchy(commentNodes);
}




/**
 * Get a comment from the given repoConnection
 * @param {String} commentId
 * @param {RepoConnection} [connection]
 * @returns {Object} Repo comment node
 */
function getComment(commentId, connection) {
    if (!connection) {
        connection = nodeLib.connect({
            repoId: REPO_ID,
            branch: "master",
        });
    }
    return connection.get({ keys: commentId });
}



function initializeRepo() {
    const commentsRepo = repoLib.get(REPO_ID);

    // If the comments repo is missing, create a new one.
    if (!commentsRepo || !commentsRepo.id) {
        const didCreate = createRepo();

        if (didCreate) {
            log.info('Created repo: "' + REPO_ID + '"');
        } else {
            log.error('Tried and failed to create the comments repo "' + REPO_ID + '"');
        }
    }
};


function formatDate(isoString) {
    const time = new Date(isoString);
    const timeStr = ('0' + time.getHours()).slice(-2) + ":" +
        ('0' + time.getMinutes()).slice(-2) + " " +
        ('0' + time.getDate()).slice(-2) + "/" +
        ('0' + (time.getMonth() + 1)).slice(-2) + "/" +
        time.getFullYear();
    return timeStr;
}
