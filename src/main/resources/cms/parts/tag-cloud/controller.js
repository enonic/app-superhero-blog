var stk = require('stk/stk');
var util = require('utilities');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('tag-cloud.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {

        var component = execute('portal.getComponent');
        var config = component.config;
        var title = config.title || 'Tags';
        var site = execute('portal.getSite')

        // Get all posts that have one or more tags.
        var result = execute('content.query', {
            start: 0,
            count: 0,
            //query: 'data.tags LIKE "*"', // Only return posts that have tags
            contentTypes: [
                module.name + ':post'
            ],
            aggregations: {
                tags: {
                    terms: {
                        field: "data.tags",
                        order: "_term asc",
                        size: 20
                    }
                }
            }
        });

        var buckets = result.aggregations.tags.buckets;

        // Make the font sizes
        var smallest = 8;
        var largest = 22;

        //Get the max and min counts
        var newBucket = buckets.slice();
        newBucket.sort(function(a, b) {
            return a.doc_count - b.doc_count;
        });
        var minCount = newBucket[0].doc_count; // smallest number for any tag count
        var maxCount = newBucket[newBucket.length -1].doc_count; // largest number for any tag count

        // The difference between the most used tag and the least used.
        var spread = maxCount - minCount;
        if (spread < 1) {spread = 1};

        // The difference between the largest font and the smallest font
        var fontSpread = largest - smallest;
        // How much bigger the font will be for each tag count.
        var fontStep = fontSpread / spread;

        //Bucket logic
        for (var i=0; i < buckets.length; i++) {
            buckets[i].tagUrl = site._path + '/search'; //TODO: Use site config for search page
            buckets[i].title = buckets[i].doc_count + ((buckets[i].doc_count > 1) ? ' topics' : ' topic');
            var fontSize = smallest + (buckets[i].doc_count - minCount) * fontStep;
            buckets[i].font = 'font-size: ' + fontSize + 'pt;';
        }

        var model = {
            tags: buckets,
            title: title
        }
        return model;
    }
    return renderView();
}