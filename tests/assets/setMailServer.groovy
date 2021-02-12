/**
 * Created by parveer on 21-08-19.
 */


import org.jahia.registries.ServicesRegistry
import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.mail.MailSettings

import javax.jcr.RepositoryException

JCRCallback<Object> callback = new JCRCallback<Object>() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        ServicesRegistry.instance.mailService.store(new MailSettings(true,
                "smtp://mailhog.test:1025?mail.debug=true",
                "jahia.server@test.com","jahia.notifications@test.com","Disabled"))
        return null
    }
}
JCRTemplate.instance.doExecuteWithSystemSession(callback);
