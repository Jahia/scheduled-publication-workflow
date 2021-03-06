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
        ServicesRegistry.instance.jahiaUserManagerService.createUser("editor", "digitall", "editor", properties, session)
        def siteByKey = ServicesRegistry.instance.jahiaSitesService.getSiteByKey("digitall", session)
        siteByKey.grantRoles("u:editor", new HashSet<String>(["editor"]))

        java.util.Properties reviewerProperties = new java.util.Properties();
        reviewerProperties.setProperty("emailNotificationsDisabled", "false");
        reviewerProperties.setProperty("j:email", "jahia.reviewer@test.com");
        reviewerProperties.setProperty("j:firstName", "Ace");
        reviewerProperties.setProperty("j:lastName", "Ventura");
        ServicesRegistry.instance.jahiaUserManagerService.createUser("ace", "digitall", "ventura", reviewerProperties, session)
        siteByKey.grantRoles("u:ace", new HashSet<String>(["reviewer"]))

        java.util.Properties editorInChiefProperties = new java.util.Properties();
        editorInChiefProperties.setProperty("emailNotificationsDisabled", "false");
        editorInChiefProperties.setProperty("j:email", "jahia.chief@test.com");
        editorInChiefProperties.setProperty("j:firstName", "John");
        editorInChiefProperties.setProperty("j:lastName", "McClane");
        ServicesRegistry.instance.jahiaUserManagerService.createUser("john", "digitall", "mcclane", editorInChiefProperties, session)
        siteByKey.grantRoles("u:john", new HashSet<String>(["editor-in-chief"]))

        session.save()
        return null
    }
}

JCRTemplate.instance.doExecuteWithSystemSession(callback);
