const contextLib = require('/lib/xp/context');
const contentLib = require('/lib/xp/content');
const clusterLib = require('/lib/xp/cluster');
const exportLib = require('/lib/xp/export');
const projectLib = require('/lib/xp/project');
const commentsLib = require('/lib/comments');
const taskLib = require('/lib/xp/task');

const projectData = {
    id: 'sample-blog',
    displayName: 'Superhero Blog',
    description: 'Sample blog site on Enonic XP',
    language: 'en',
    readAccess: {
        public: true
    }
}


const runInContext = function (callback) {
    let result;
    try {
        result = contextLib.run({
            branch: 'draft',
            principals: ["role:system.admin"],
            repository: 'com.enonic.cms.' + projectData.id
        }, callback);
    } catch (e) {
        log.info('Error: ' + e.message);
    }

    return result;
}

const initComments = function () {
    return commentsLib.initializeRepo();
}

const getProject = function () {
    return projectLib.get({
        id: projectData.id
    });
}

const createProject = function () {
    return projectLib.create(projectData);
}

const initialize = function () {
    runInContext(() => {
        // Initialize comments
        taskLib.executeFunction({
            description: 'Setting up comments repo',
            func: initComments
        });

        // Initialize content
        const project = getProject();
        if (!project) {
            taskLib.executeFunction({
                description: 'Importing content',
                func: initProject
            });
        }
        else {
            log.debug(`Project ${project.id} exists, skipping import`);
        }
    });
};

const initProject = function () {
    // log.info('Project "' + projectData.id + '" not found. Creating...');
    const project = createProject();

    if (project) {
        log.info('Project "' + projectData.id + '" successfully created');
        createContent();
        publishRoot();
    } else {
        log.error('Project "' + projectData.id + '" creation failed');
    }
};

function createContent() {
    let importNodes = exportLib.importNodes({
        source: resolve('/import'),
        targetNodePath: '/content',
        xslt: resolve('/import/replace_app.xsl'),
        xsltParams: {
            applicationId: app.name
        },
        includeNodeIds: true
    });
    if (importNodes.importErrors.length > 0) {
        log.warning('Errors:');
        importNodes.importErrors.forEach(element => log.warning(element.message));
        log.info('-------------------');
    }
}

function publishRoot() {
    const result = contentLib.publish({
        keys: ['/superhero'],
        sourceBranch: 'draft',
        targetBranch: 'master',
    });
    if (!result) {
       log.warning('Could not publish imported content.');
    }
}

if (clusterLib.isMaster()) {
    initialize();
}
