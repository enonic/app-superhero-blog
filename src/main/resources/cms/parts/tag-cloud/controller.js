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

    // Loop through the posts
    for (var i = 0; i < result.contents.length; i++) {

        var content = result.contents[i];
        var tags = stk.data.forceArray(content.data.tags); // Turn single tags into arrays.

        // Loop through each tag entry in the post
        for (var j = 0; j < tags.length; j++) {

            // Put each unique tag into an object
            var tagName = tags[j];
            if(tagName in tagsGroup) {
                // This tag name is already in the object so update the count.
                tagsGroup[tagName].data.count += 1;
                tagsGroup[tagName].data.title = tagsGroup[tagName].data.count + ' topics'
            } else {
                // This tag is not in the group so make an object and add it.
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

    // Make the font sizes
    var smallest = 8;
    var largest = 22;

    var counts = new Array();

    for (var tagNameKey in tagsGroup) {
        counts.push(tagsGroup[tagNameKey].data.count);
    }
    var minCount = Math.min.apply(null, counts); // smallest number for any tag count
    var maxCount = Math.max.apply(null, counts); // largest number for any tag count

    // The difference between the most used tag and the least used.
    var spread = maxCount - minCount;
    if (spread < 1) {spread = 1};

    // The difference between the largest font and the smallest font
    var fontSpread = largest - smallest;
    // How much bigger the font will be for each tag count.
    var fontStep = fontSpread / spread;

    // Push each tag object into an array so it can be sorted and apply the font steps.
    for (var tagNameKey in tagsGroup) {
        var fontSize = smallest + (tagsGroup[tagNameKey].data.count - minCount) * fontStep;
        tagsGroup[tagNameKey].data.font = 'font-size: ' + fontSize + 'pt;';
        tagsArray.push(tagsGroup[tagNameKey]);
    }

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