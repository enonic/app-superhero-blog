/**
* Force data to an array.
* @param {Object or Array} The object to be processed.
* @return {Array} The resulting array.
*/
exports.forceArray = function(data) {
    if (!Array.isArray(data)) {
        data = [data];
    }
    return data;
};

/**
* Trim empty array elements.
* @param {Array} The array to be processed.
* @return {Array} The trimmed array.
*/
exports.trimArray = function(array) {
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
    return trimmedArray;
};

/**
* Delete all properties with empty string from an object
* @param {Object} The object to be processed.
* @param {Boolean} Flag true to delete properties in nested objects.
* @return {Boolean} Returns true if the value is an integer or can be cast to an integer.
*/
exports.deleteEmptyProperties = function(obj, recursive) {
    for (var i in obj) {
        if (obj[i] === '') {
            delete obj[i];
        } else if (recursive && typeof obj[i] === 'object') {
            exports.deleteEmptyProperties(obj[i], recursive);
        }
    }
};

/**
* Check if value is an integer
* @param {Object} The value to check.
* @return {Boolean} Returns true if the value is an integer or can be cast to an integer.
*/
exports.isInt = function(value) {
    return !isNaN(value) &&
        parseInt(Number(value)) == value &&
        !isNaN(parseInt(value, 10));
};

/**
 * Check if an object is empty.
 * @param {Object} The object to check
 * @return {Boolean} Returns true if the object is empty.
 */
exports.isEmpty = function(obj) {
    return Object.keys(obj).length === 0;
};
