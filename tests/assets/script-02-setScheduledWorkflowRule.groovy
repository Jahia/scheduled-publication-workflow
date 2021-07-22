/**
 * Created by parveer on 21-08-19.
 */

import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate

import javax.jcr.RepositoryException

JCRCallback<Object> callback = new JCRCallback<Object>() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        def homepageNode = session.getNode("/sites/digitall/home")
        homepageNode.addMixin("jmix:workflowRulesable")
        def workflowRulesNode = homepageNode.addNode("j:workflowRules", "jnt:workflowRules")
        def workflowRuleNode = workflowRulesNode.addNode("jBPM_default-workflow", "jnt:workflowRule")
        workflowRuleNode.setProperty("j:workflow", "jBPM:default-workflow")
        session.save()
        return null
    }
}
JCRTemplate.instance.doExecuteWithSystemSession(callback);
