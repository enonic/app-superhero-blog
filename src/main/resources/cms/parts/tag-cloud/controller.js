var stk = require('stk/stk');
var util = require('utilities');

exports.get = function(req) {

    var content = execute('portal.getContent');
    var component = execute('portal.getComponent');
    var config = component.config;
    var title = config.title || 'Tags';
    var site = execute('portal.getSite');
    var moduleConfig = site.data.moduleConfig.config;

    var tagsArray = [];
    var tagsGroup = {};

    // Get all posts that have one or more tags.
    var result = execute('content.query', {
        start: 0,
        count: 1000,
        query: 'data.tags LIKE "*"', // Only return posts that have tags
        contentTypes: [
            module.name + ':post'
        ]
    });

    //stk.log(result);

    // Loop through the posts
    for (var i = 0; i < result.contents.length; i++) {

        var content = result.contents[i];
        var tags = stk.data.forceArray(content.data.tags); // Turn single tags into arrays.

        // Loop through each tag entry in the post
        for (var j = 0; j < tags.length; j++) {

            // Need tag name, tag URL (site_path), number of occurrences
            // Put each unique tag into an object
            var tagName = tags[j];
            if(tagName in tagsGroup) {
                tagsGroup[tagName].data.count += 1;
                tagsGroup[tagName].data.title = tagsGroup[tagName].data.count + ' topics'
            } else {
                var tagData = {
                    tagName: tagName,
                    data: {
                        tagUrl: site._path,
                        count: 1,
                        title: '1 topic'
                    }
                };
                tagsGroup[tagName] = tagData;
            }
        }
    }

    var smallest = 8;
    var largest = 22;

    var counts = new Array();

    for (var tagNameKey in tagsGroup) {
        counts.push(tagsGroup[tagNameKey].data.count);
    }
    var minCount = Math.min.apply(null, counts); // smallest number for any tag count
    var maxCount = Math.max.apply(null, counts); // largest number for any tag count


    var spread = maxCount - minCount;
    if (spread < 1) {spread = 1};

    var fontSpread = largest - smallest;
    var fontStep = fontSpread / spread;


    // Push each tag object into an array so it can be sorted.
    for (var tagNameKey in tagsGroup) {
        var fontSize = smallest + (tagsGroup[tagNameKey].data.count - minCount) * fontStep;
        tagsGroup[tagNameKey].data.font = 'font-size: ' + fontSize + 'pt;';
        tagsArray.push(tagsGroup[tagNameKey]);
    }

    stk.log(tagsGroup);

    // Sort the array alphabetically but it doesn't work because there is no locale
    tagsArray.sort(function (a, b) {
        return a.tagName.localeCompare(b.tagName);
    });

    var params = {
        tags: tagsArray,
        site: site,
        config: config,
        title: title
    }

    var view = resolve('tag-cloud.html');
    return stk.view.render(view, params);
};