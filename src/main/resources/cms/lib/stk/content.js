exports.content = {};

// Get content by key (path or id)
exports.content.get = function (key) {
    var content;
    if (typeof key == 'undefined') {
        content = execute('portal.getContent');
    }
    else {
        content = execute('content.get', {
            key: key
        });
    }
    return content;
};

// Check if content exists at path
exports.content.exists = function(path) {
    return exports.content.get(path) ? true : false;
};

// Get content property
exports.content.getProperty = function(key, property) {
    if (!key || !property) {
        return null;
    }
    var result = exports.content.get(key);
    return result ? result[property] : null;
};

/**
 * Returns the path to the content location. If the key to a content is passed, it will be used. If contenKey is null, the path
 * to the page that the part is on will be returned.
 * @param {Content} content key. Example: config['saveFolder']
 * @param {Boolean} force null return if no content found with the key
 * @return {String} Returns the path of the save location.
 */
exports.content.getPath = function(contentKey, noDefault) {
    var defaultContent = '';
    if(noDefault) {
        defaultContent._path = null;
    } else {
        defaultContent = execute('portal.getContent');
    }

    var contentPath;
    if (contentKey) {
        var content = exports.content.get(contentKey);
        if (content) {
            contentPath = content._path;
        }
    }
    return contentPath ? contentPath : defaultContent._path;
};

/**
* Returns the parent path of the content path that is passed.
* @param {String} path of the content to check.
* @Return {String} path of the parent content.
*/
exports.content.getParentPath = function(path) {
    var pathArray = path.split('/')
    return pathArray.slice(0, pathArray.length -1).join('/');
};