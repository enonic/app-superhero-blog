var stk = require('/lib/stk/stk');

var portal = require('/lib/xp/portal');
var thymeleaf = require('/lib/thymeleaf');

exports.get = handleGet;

function handleGet(req) {

    function renderView() {
        var view = resolve('faq-list.html');
        var model = createModel();

        return {
            body: thymeleaf.render(view, model),
            contentType: 'text/html'
        };
    }

    function createModel() {
        var component = portal.getComponent();
        var config = component.config;
        var isEditMode = req.mode === 'edit';

        var faqs = [];
        var faqConfigs = stk.data.forceArray(config.faqs);
        faqConfigs.forEach(function(faqConfig) {
            if (faqConfig.question && faqConfig.answer) {
                faqs.push({
                    question: faqConfig.question,
                    answer: portal.processHtml({
                        value: faqConfig.answer
                    })
                });
            }
        });

        if (!faqs.length && isEditMode) {
            faqs = [{
                question: '<questions are shown here>',
                answer: ''
            }]
        }

        var model = {
            title: config.title || null,
            faqs: faqs
        };

        return model;
    }

    return renderView();
}
