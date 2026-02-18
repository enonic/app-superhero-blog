const thymeleaf = require('/lib/thymeleaf');
const util = require('/lib/utilities');

const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');

const view = resolve('tag-cloud.html');



function getBuckets(result) {
    let buckets = null;
    if (result && result.aggregations &&
        result.aggregations.tags &&
        result.aggregations.tags.buckets
    ) {
        buckets = [];

        const results = result.aggregations.tags.buckets;

        // Prevent ghost tags from appearing in the part
        for (let i = 0; i < results.length; i++) {
            if (results[i].docCount > 0) {
                buckets.push(results[i]);
            }
        }

        if (buckets.length > 0) {

            // Make the font sizes
            const smallest = 8;
            const largest = 22;

            //Get the max and min counts
            const newBucket = buckets.slice();
            newBucket.sort(function (a, b) {
                return a.docCount - b.docCount;
            });
            const minCount = newBucket[0].docCount; // smallest number for any tag count
            const maxCount = newBucket[newBucket.length - 1].docCount; // largest number for any tag count

            // The difference between the most used tag and the least used.
            let spread = maxCount - minCount;
            if (spread < 1) {
                spread = 1
            }

            // The difference between the largest font and the smallest font
            const fontSpread = largest - smallest;
            // How much bigger the font will be for each tag count.
            const fontStep = fontSpread / spread;

            //Bucket logic
            for (let i = 0; i < buckets.length; i++) {
                buckets[i].tagUrl = util.getSearchPage();
                buckets[i].title = buckets[i].docCount + ((buckets[i].docCount > 1) ? ' topics' : ' topic');
                const fontSize = smallest + (buckets[i].docCount - minCount) * fontStep;
                buckets[i].font = 'font-size: ' + fontSize + 'pt;';
            }
        }
    }

    return buckets;
}



exports.get = function handleGet(req) {
    const component = portal.getComponent();
    const config = component.config;
    const title = config.title || 'Tags';
    const site = portal.getSite();

    // Get all posts that have one or more tags.
    const result = contentLib.query({
        start: 0,
        count: 0,
        query: "_path LIKE '/content" + site._path + "/*'", // Only get tags from this site.
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

    const model = {
        tags: getBuckets(result),
        title: title
    };

    return {
        body: thymeleaf.render(view, model)
    };
}
