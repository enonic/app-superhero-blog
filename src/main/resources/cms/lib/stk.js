exports.log = function (data) {
    log.info('STK log %s', JSON.stringify(data, null, 4));
};

exports.data = {};
exports.content = {};
exports.view = {};


// Force data to array
exports.data.forceArray = function(data, callback) {
    if (!Array.isArray(data)) {
        data = [data];

        if (typeof callback === "function") {
            callback(data);
        }
    }
};

// Trim empty array elements
exports.data.trimArray = function(array, callback) {
    var trimmedArray = [];
    for (var i = 0; i < array.length; i++) {
        var empty = true;
        var object = array[i];

        for (var key in object) {
            if (object[key] !== '') {
                empty = false;
            }
        }
        if (!empty) {
            trimmedArray.push(object);
        }
    }

    if (typeof callback === "function") {
        callback(trimmedArray);
    }
};

// Delete all properties with empty string from an object
// Set 'recursive' to true if you also want to delete properties in nested objects
exports.data.deleteEmptyProperties = function(obj, recursive) {
    for (var i in obj) {
        if (obj[i] === '') {
            delete obj[i];
        } else if (recursive && typeof obj[i] === 'object') {
            exports.data.deleteEmptyProperties(obj[i], recursive);
        }
    }
};

// Check if value is integer
exports.data.isInt = function(value) {
    return !isNaN(value) &&
        parseInt(Number(value)) == value &&
        !isNaN(parseInt(value, 10));
};


// Check if content exists at path
exports.content.exists = function(path) {
    var result = execute('content.get', {
        key: path
    });

    return result ? true : false;
};

exports.view.render = function(view, params) {
    return {
        body: execute('thymeleaf.render', {
            view: view,
            model: params
        })
    };
};