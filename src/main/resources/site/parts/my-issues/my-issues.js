const portal = require('/lib/xp/portal');
const auth = require('/lib/xp/auth');
const contentLib = require("/lib/xp/content");
const thymeleaf = require("/lib/thymeleaf");
const httpClient = require('/lib/http-client');
    // --- Configuration ---
    // IMPORTANT: Store your API key securely, e.g., in site config, app config, or environment variables.
    // Do NOT hardcode it in production code.
const apiKey = app.config.limeApiKey; 


exports.get = function(req) {
 

    const component = portal.getComponent();
    const componentUrl = portal.componentUrl({component: component.path});
    const currentContent = portal.getContent();
    
    const headline = ((component.config.headline || '') + '').trim() || 'My issues';

    var view = resolve('my-issues.html');
    var user = auth.getUser();
    var model = {};
    model.headline = headline;
    model.componentUrl = componentUrl;
    model.currentContent = currentContent;


    // 1. Check if user is logged in
    if (!user || !user.email) {
        model.error = "Please log in to view your helpdesk tickets.";
        return {
            body: thymeleaf.render(view, model)
        };
    }

    // 2. Handle preview mode
    if (req.mode == 'edit' || req.mode == 'inline') {
        model.error = "Preview, or visit live site to see heldesk issues!";
        return {
            body: thymeleaf.render(view, model)
        };
    }

    try {

        const personApiUrl = 'https://limeutilitynett.lime-crm.com/limeutilitynett/api/v1/limeobject/person/';
        model.user = user; // Pass user to view for info

        // --- Step 1: Get Person from Lime CRM ---
        var personResponse = httpClient.request({
            url: personApiUrl,
            method: 'GET',
            params: {
                '_limit': '1',
                'email': user.email
            },
            headers: {
                'x-api-key': apiKey,
                'accept': 'application/hal+json'
            },
            connectTimeout: 5000,
            readTimeout: 5000
        });

        if (personResponse.status !== 200) {
            throw new Error('Lime person API returned status ' + personResponse.status);
        }

        var personResult = JSON.parse(personResponse.body);
        
        // Check if user was found
        if (!personResult._embedded || !personResult._embedded.limeobjects || personResult._embedded.limeobjects.length === 0) {
            model.error = "We could not find your user profile in our customer system.";
            return { body: thymeleaf.render(view, model) };
        }

        var personData = personResult._embedded.limeobjects[0];
        model.person = personData; // Add person data to the model

        // Get the helpdesk URL from the first response
        var helpdeskUrl = personData._links.relation_helpdesk.href;

        if (!helpdeskUrl) {
            throw new Error('Could not find helpdesk relation link for user.');
        }

        // --- Step 2: Get Helpdesk Tickets ---
        var helpdeskResponse = httpClient.request({
            url: helpdeskUrl, // This is the full URL from the previous response
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'accept': 'application/hal+json'
            },
            connectTimeout: 5000,
            readTimeout: 5000
        });

        if (helpdeskResponse.status !== 200) {
            throw new Error('Lime helpdesk API returned status ' + helpdeskResponse.status);
        }

        var helpdeskResult = JSON.parse(helpdeskResponse.body);
        
        // Get the array of tickets, or an empty array if none exist
        var tickets = helpdeskResult._embedded ? helpdeskResult._embedded.limeobjects : [];
        model.tickets = tickets;

    } catch (e) {
        log.error('Error fetching Lime CRM data for user ' + (user ? user.email : 'GUEST') + ': ' + e.message);
        // Provide a generic error to the user
        model.error = 'We are currently unable to fetch your ticket information. Please try again later.';
    }
    
    // Render the Thymeleaf view with the model
    return {
        body: thymeleaf.render(view, model)
    };

};

exports.post = function(req) {
    log.info('POST received to create helpdesk issue');

    // --- Configuration ---
    const helpdeskApiUrl = 'https://limeutilitynett.lime-crm.com/limeutilitynett/api/v1/limeobject/helpdesk/';
    // ---------------------

    let responseMessage = '';
    let responseStatus = 500; // Default to server error

    try {
        // 1. Check user authentication
        const user = auth.getUser();
        if (!user) {
            responseMessage = 'Failed to create issue: User not logged in.';
            responseStatus = 401; // Unauthorized
            throw new Error(responseMessage);
        }

        // 2. Get parameters from the form
        const personId = req.params.personId;
        const issueText = req.params.issue ? req.params.issue.trim() : null;

        if (!personId || !issueText) {
            responseMessage = 'Failed to create issue: Missing issue description.';
            responseStatus = 400; // Bad Request
            throw new Error(responseMessage);
        }

        // 3. Construct the minimal API payload
        // We make assumptions for priority, status, and source.
        // Adjust "key" values if "normal", "received", or "web" are incorrect.
        const payload = {
            person: parseInt(personId, 10), // Lime API expects an integer
            subject: issueText.substring(0, 30), // Use first 30 chars as subject
            description: issueText,
            company: 1033,
            value: 0,
            subtotal: 0,
            discount: 0,
            vat: 0,
            first_contact: '2025-10-23T12:00:00.000Z',
            lat_maps_dec: 0,
            long_maps_dec: 0,
            max_car_charging_equip_amps: 16,
            registered_to_end_date: 0,
            first_contact_to_end_date: 0,
            registered_to_first_contact: 0,
            start_date_to_end_date: 0,
        };

        // 4. Make the API Call
        const limeResponse = httpClient.request({
            url: helpdeskApiUrl,
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'accept': 'application/hal+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload), // Send payload as a JSON string
            connectTimeout: 5000,
            readTimeout: 5000
        });

        // 5. Handle the API Response
        // 201 Created is the standard REST response for a successful POST
        if (limeResponse.status === 201) {
            log.info('Successfully created Lime helpdesk issue for person ' + personId);
            responseMessage = 'Successfully created issue';
            responseStatus = 200; // OK
        } else {
            // Try to parse a specific error message from Lime
            let apiError = 'API returned status ' + limeResponse.status;
            try {
                const errorBody = JSON.parse(limeResponse.body);
                if (errorBody && errorBody.message) {
                    apiError = errorBody.message;
                }
            } catch (e) {
                // Body was not JSON, just use the raw body
                apiError += ': ' + limeResponse.body;
            }
            
            responseMessage = 'Failed to create issue: ' + apiError;
            responseStatus = 500; // Internal Server Error
            log.error('Lime API Error: ' + responseMessage);
        }

    } catch (e) {
        log.error('Exception in exports.post for helpdesk: ' + e.message);
        // If we didn't set a specific message yet, use the exception message
        if (!responseMessage) {
            responseMessage = 'Failed to create issue: ' + e.message;
        }
    }

    // Return the simple text response
    return {
        body: responseMessage,
        contentType: 'text/plain',
        status: responseStatus
    };
};
