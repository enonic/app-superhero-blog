exports.content = {};

// Get content by key (path or id)
exports.content.get = function(key) {
    return execute('content.get', {
        key: key
    });
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
 * Returns the path to the save location. If the key to a folder or content is passed, it will be used. If no folder was selected, the path
 * to the page that the part is on will be returned.
 * @param {Content} content key of the selected folder, if one was selected. Example: config['saveFolder']
 * @return {String} Returns the path of the save location.
 */
exports.content.getSaveLocation = function(folderKey) {
    var content = execute('portal.getContent');
    var saveFolder;
    if (folderKey) {
        var folder = execute('content.get', {
            key: folderKey
        });
        if (folder) {
            saveFolder = folder._path;
        }
    }
    return saveFolder ? saveFolder : content._path;
};