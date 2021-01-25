exports.data = require('data.js').data;
exports.content = require('content.js').content;
exports.view = require('view.js').view;

exports.log = function (data) {
    log.info('STK log %s', JSON.stringify(data, null, 4));
};
