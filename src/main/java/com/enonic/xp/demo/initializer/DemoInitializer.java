package com.enonic.xp.demo.initializer;

import java.util.concurrent.Callable;

import org.osgi.framework.Bundle;
import org.osgi.framework.FrameworkUtil;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.enonic.xp.content.ApplyContentPermissionsParams;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.UpdateContentParams;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.export.ExportService;
import com.enonic.xp.export.ImportNodesParams;
import com.enonic.xp.export.NodeImportResult;
import com.enonic.xp.node.NodePath;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.User;
import com.enonic.xp.security.acl.AccessControlEntry;
import com.enonic.xp.security.acl.AccessControlList;
import com.enonic.xp.security.acl.Permission;
import com.enonic.xp.security.auth.AuthenticationInfo;
import com.enonic.xp.vfs.VirtualFile;
import com.enonic.xp.vfs.VirtualFiles;


@Component(immediate = true)
public class DemoInitializer
{

    private static final AccessControlList PERMISSIONS =
        AccessControlList.of( AccessControlEntry.create().principal( PrincipalKey.ofAnonymous() ).allow( Permission.READ ).build(),
                              AccessControlEntry.create().principal( RoleKeys.EVERYONE ).allow( Permission.READ ).build(),
                              AccessControlEntry.create().principal( RoleKeys.AUTHENTICATED ).allowAll().build(),
                              AccessControlEntry.create().principal( RoleKeys.CONTENT_MANAGER_ADMIN ).allowAll().build() );


    private ContentService contentService;

    private ExportService exportService;

    private final Logger LOG = LoggerFactory.getLogger( DemoInitializer.class );

    @Activate
    public void initialize()
        throws Exception
    {
        runAs( RoleKeys.CONTENT_MANAGER_ADMIN, () -> {
            doInitialize();
            return null;
        } );
    }

    private void doInitialize()
        throws Exception
    {
        final ContentPath demoSitePath = ContentPath.from( "/demo-site" );
        if ( hasContent( demoSitePath ) )
        {
            return;
        }

        final Bundle bundle = FrameworkUtil.getBundle( this.getClass() );

        final VirtualFile source = VirtualFiles.from( bundle, "/import" );

        final NodeImportResult nodeImportResult = this.exportService.importNodes( ImportNodesParams.create().
            source( source ).
            targetNodePath( NodePath.newPath( "/content" ).build() ).
            includeNodeIds( true ).
            dryRun( false ).
            build() );

        logImport( nodeImportResult );

        // set permissions
        final Content demoContent = contentService.getByPath( demoSitePath );
        if ( demoContent != null )
        {
            final UpdateContentParams setFeaturesPermissions = new UpdateContentParams().
                contentId( demoContent.getId() ).
                editor( ( content ) -> {
                    content.permissions = PERMISSIONS;
                    content.inheritPermissions = false;
                } );
            contentService.update( setFeaturesPermissions );

            contentService.applyPermissions( ApplyContentPermissionsParams.create().
                contentId( demoContent.getId() ).
                modifier( PrincipalKey.ofAnonymous() ).
                build() );
        }
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
            return this.contentService.getByPath( path ) != null;
        }
        catch ( final Exception e )
        {
            return false;
        }
    }

    @Reference
    public void setExportService( final ExportService exportService )
    {
        this.exportService = exportService;
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }

    private <T> T runAs( final PrincipalKey role, final Callable<T> runnable )
    {
        final AuthenticationInfo authInfo = AuthenticationInfo.create().principals( role ).user( User.ANONYMOUS ).build();
        return ContextBuilder.from( ContextAccessor.current() ).authInfo( authInfo ).build().callWith( runnable );
    }

}
