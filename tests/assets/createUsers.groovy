import org.jahia.registries.ServicesRegistry
import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.content.decorator.JCRSiteNode
import org.jahia.services.content.decorator.JCRUserNode

import javax.jcr.RepositoryException

JCRCallback<Object> callback = new JCRCallback<Object>() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {

        java.util.Properties properties = new java.util.Properties();
        properties.setProperty("emailNotificationsDisabled", "false");
        properties.setProperty("j:email", "jahia.editor@test.com");
        properties.setProperty("j:firstName", "Editor");
        properties.setProperty("j:lastName", "Test");
        def user = ServicesRegistry.instance.jahiaUserManagerService.createUser("editor", "digitall", "editor", properties, session)
        def siteByKey = ServicesRegistry.instance.jahiaSitesService.getSiteByKey("digitall", session)
        siteByKey.grantRoles("u:editor", new HashSet<String>(["editor"]))
        session.save()
        return null;
    }
}

JCRTemplate.instance.doExecuteWithSystemSession(callback);
