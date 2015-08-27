var stk = require('stk/stk');
var util = require('utilities');

var contentLib = require('/lib/xp/content');
var portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('tag-cloud.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {

        var component = portal.getComponent();
        var config = component.config;
        var title = config.title || 'Tags';
        var site = portal.getSite();

        // Get all posts that have one or more tags.
        var result = contentLib.query({
            start: 0,
            count: 0,
            //query: "ngram('_path', '" + site._path + "', 'AND')",
            //query: "_path = '/superhero/posts/gotham-sure-is-a-big-town'",
            contentTypes: [
                app.name + ':post'
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

        var buckets = null;

        if (result && result.aggregations && result.aggregations.tags && result.aggregations.tags.buckets) {
            buckets = [];

            var results = result.aggregations.tags.buckets;

            // Prevent ghost tags from appearing in the part
            for (var i = 0; i < results.length; i++) {
                if (results[i].docCount > 0) {
                    buckets.push(results[i]);
                }
            }

            if (buckets.length > 0) {

                // Make the font sizes
                var smallest = 8;
                var largest = 22;

                //Get the max and min counts
                var newBucket = buckets.slice();
                newBucket.sort(function (a, b) {
                    return a.docCount - b.docCount;
                });
                var minCount = newBucket[0].docCount; // smallest number for any tag count
                var maxCount = newBucket[newBucket.length - 1].docCount; // largest number for any tag count

                // The difference between the most used tag and the least used.
                var spread = maxCount - minCount;
                if (spread < 1) {
                    spread = 1
                }
                ;

                // The difference between the largest font and the smallest font
                var fontSpread = largest - smallest;
                // How much bigger the font will be for each tag count.
                var fontStep = fontSpread / spread;

                //Bucket logic
                for (var i = 0; i < buckets.length; i++) {
                    buckets[i].tagUrl = util.getSearchPage();
                    buckets[i].title = buckets[i].docCount + ((buckets[i].docCount > 1) ? ' topics' : ' topic');
                    var fontSize = smallest + (buckets[i].docCount - minCount) * fontStep;
                    buckets[i].font = 'font-size: ' + fontSize + 'pt;';
                }
            }
        }

        var model = {
            tags: buckets,
            title: title
        };
        return model;
    }

    return renderView();
}