import org.jahia.registries.ServicesRegistry
import org.jahia.services.mail.MailSettings

ServicesRegistry.instance.mailService.store(new MailSettings(
        true,
        "smtp://mailhog.test:1025?mail.debug=true",
        "jahia.server@test.com",
        "jahia.notifications@test.com",
        "Disabled"));
