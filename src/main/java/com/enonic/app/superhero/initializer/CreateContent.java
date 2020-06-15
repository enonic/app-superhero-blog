package com.enonic.app.superhero.initializer;

import java.util.concurrent.Callable;
import java.util.function.Supplier;

import org.osgi.framework.Bundle;
import org.osgi.framework.FrameworkUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.export.ExportService;
import com.enonic.xp.export.ImportNodesParams;
import com.enonic.xp.export.NodeImportResult;
import com.enonic.xp.index.IndexService;
import com.enonic.xp.lib.content.BaseContextHandler;
import com.enonic.xp.node.NodePath;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.User;
import com.enonic.xp.security.auth.AuthenticationInfo;
import com.enonic.xp.vfs.VirtualFile;
import com.enonic.xp.vfs.VirtualFiles;

public class CreateContent
    extends BaseContextHandler
{
    private String projectName;

    private Supplier<ContentService> contentService;

    private Supplier<ExportService> exportService;

    private Supplier<IndexService> indexService;

    private final Logger LOG = LoggerFactory.getLogger( CreateContent.class );

    @Override
    protected Boolean doExecute()
    {
        if ( this.indexService.get().isMaster() )
        {
            runAs( createInitContext(), () -> {
                doInitialize();
                return null;
            } );
        }

        return true;
    }

    private Context createInitContext()
    {

        return ContextBuilder.from( ContextAccessor.current() ).
            authInfo( AuthenticationInfo.create().principals( RoleKeys.CONTENT_MANAGER_ADMIN ).user( User.ANONYMOUS ).build() ).
            branch( ContentConstants.BRANCH_DRAFT ).
            repositoryId( ProjectName.from(this.projectName).getRepoId() ).
            build();
    }

    private void doInitialize()
    {

        final ContentPath demoSitePath = ContentPath.from( "/superhero" );
        if ( hasContent( demoSitePath ) )
        {
            return;
        }

        final Bundle bundle = FrameworkUtil.getBundle( this.getClass() );

        final VirtualFile source = VirtualFiles.from( bundle, "/import" );

        final NodeImportResult nodeImportResult = this.exportService.get().importNodes( ImportNodesParams.create().
            source( source ).
            targetNodePath( NodePath.create( "/content" ).build() ).
            includeNodeIds( true ).
            includePermissions( false ).
            dryRun( false ).
            build() );

        logImport( nodeImportResult );
    }

    private void logImport( final NodeImportResult nodeImportResult )
    {
        LOG.info( "-------------------" );
        LOG.info( "Imported nodes:" );
        for ( final NodePath nodePath : nodeImportResult.getAddedNodes() )
        {
            LOG.info( nodePath.toString() );
        }

        LOG.info( "-------------------" );
        LOG.info( "Binaries:" );
        nodeImportResult.getExportedBinaries().forEach( LOG::info );

        LOG.info( "-------------------" );
        LOG.info( "Errors:" );
        for ( final NodeImportResult.ImportError importError : nodeImportResult.getImportErrors() )
        {
            LOG.info( importError.getMessage(), importError.getException() );
        }
    }

    private boolean hasContent( final ContentPath path )
    {
        try
        {
            return this.contentService.get().getByPath( path ) != null;
        }
        catch ( final Exception e )
        {
            return false;
        }
    }

    public void setProjectName( final String value )
    {
        this.projectName = value;
    }

    @Override
    public void initialize( final BeanContext context )
    {
        this.indexService = context.getService( IndexService.class );
        this.contentService = context.getService( ContentService.class );
        this.exportService = context.getService( ExportService.class );
    }

    private <T> T runAs( final Context context, final Callable<T> runnable )
    {
        return context.callWith( runnable );
    }
}
