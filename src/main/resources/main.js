const projectLib = require('/lib/xp/project');
const contextLib = require('/lib/xp/context');
const clusterLib = require('/lib/xp/cluster');
const commentsLib = require('/lib/comments');

const projectData = {
    id: 'sample-blog',
    displayName: 'Superhero Blog',
    description: 'Sample blog site on Enonic XP',
    language: 'en',
    readAccess: {
        public: true
    }
}

function runInContext(callback) {
    let result;
    try {
        result = contextLib.run({
            principals: ["role:system.admin"]
        }, callback);
    } catch (e) {
        log.info('Error: ' + e.message);
    }

    return result;
}

function createProject() {
    return projectLib.create(projectData);
}

function getProject() {
    return projectLib.get({
        id: projectData.id
    });
}

function initialize() {

    let project = runInContext(getProject);

    if (!project) {
        log.info('Project "' + projectData.id + '" not found. Creating...');
        project = runInContext(createProject);


        if (project) {
            log.info('Project "' + projectData.id + '" successfully created');
        }
        const didCreate = runInContext(commentsLib.createRepo);
        if (didCreate) {
            log.info('Repo "' + commentsLib.REPO_ID + '" successfully created');
        }
    }

    if (project) {
        createContent();
    } else {
        log.error('Project "' + projectData.id + '" failed to be created');
    }

};

function createContent() {
    const bean = __.newBean('com.enonic.app.superhero.initializer.CreateContent');
    bean.projectName = projectData.id;
    return __.toNativeObject(bean.execute());
}

if (clusterLib.isMaster()) {
    initialize();
}
