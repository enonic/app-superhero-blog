const stk = require('/lib/stk/stk');

const portal = require('/lib/xp/portal');
const thymeleaf = require('/lib/thymeleaf');

exports.get = function handleGet(req) {

    function renderView() {
        const view = resolve('faq-list.html');
        const model = createModel();

        return {
            body: thymeleaf.render(view, model),
            contentType: 'text/html'
        };
    }

    function createModel() {
        const component = portal.getComponent();
        const config = component.config;
        const isEditMode = req.mode === 'edit';

        let faqs = [];
        const faqConfigs = stk.data.forceArray(config.faqs);
        faqConfigs.forEach(function(faqConfig) {
            if (faqConfig && faqConfig.question && faqConfig.answer) {
                faqs.push({
                    question: faqConfig.question,
                    answer: faqConfig.answer
                    /*answer: portal.processHtml({
                        value: faqConfig.answer
                    })*/
                });
            }
        });

        if (!faqs.length && isEditMode) {
            faqs = [{
                question: '<questions are shown here>',
                answer: ''
            }]
        }

        const model = {
            title: config.title || null,
            faqs: faqs
        };

        return model;
    }

    return renderView();
}
