package org.jahia.modules.workflows.scheduled;

import org.jahia.api.Constants;
import org.jahia.services.content.JCRCallback;
import org.jahia.services.content.JCRSessionWrapper;
import org.jahia.services.content.JCRTemplate;
import org.jahia.services.content.decorator.JCRGroupNode;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.usermanager.*;
import org.jahia.services.workflow.WorkflowDefinition;
import org.jahia.services.workflow.WorkflowService;
import org.jahia.services.workflow.jbpm.JBPM6WorkflowProvider;
import org.kie.api.runtime.process.WorkItem;
import org.kie.api.runtime.process.WorkItemHandler;
import org.kie.api.runtime.process.WorkItemManager;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;
import java.util.*;

@Component(immediate=true)
public class CheckTaskPermissionWorkItemHandler implements WorkItemHandler {

    private static final Logger logger = LoggerFactory.getLogger(CheckTaskPermissionWorkItemHandler.class);
    private static final String TASK_NAME = "Check task permission";

    private WorkflowService workflowService;
    private JahiaGroupManagerService groupManagerService;

    @Reference
    public void setWorkflowService(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @Reference
    public void setGroupManagerService(JahiaGroupManagerService groupManagerService) {
        this.groupManagerService = groupManagerService;
    }

    @Activate
    public void start(BundleContext bundleContext) throws Exception {
        logger.info("Registering custom work item handler {}", TASK_NAME);
        JBPM6WorkflowProvider workflowProvider = (JBPM6WorkflowProvider) workflowService.getProviders().get("jBPM");
        workflowProvider.registerWorkItemHandler(TASK_NAME, this);
    }

    @Deactivate
    public void stop(BundleContext bundleContext) throws Exception {
        logger.info("Un-registering custom work item handler {}", TASK_NAME);
        JBPM6WorkflowProvider workflowProvider = (JBPM6WorkflowProvider) workflowService.getProviders().get("jBPM");
        workflowProvider.unregisterWorkItemHandler(TASK_NAME);
    }

    @Override
    public void executeWorkItem(WorkItem workItem, WorkItemManager workItemManager) {
        logger.info("executeWorkItem");
        Map<String,Object> results = new HashMap<>();

        final Map<String, Object> vars = workItem.getParameters();
        String taskName = (String) vars.get("taskName");
        Locale locale = (Locale) vars.get("locale");
        String userKey = (String) workItem.getParameter("user");
        if (workItem.getParameter("currentUser") != null) {
            userKey = (String) workItem.getParameter("currentUser");
        }

        String finalUserKey = userKey;
        try {
            Boolean userKeyMatches = JCRTemplate.getInstance().doExecuteWithSystemSessionAsUser(null, Constants.EDIT_WORKSPACE, locale, new JCRCallback<Boolean>() {
                @Override
                public Boolean doInJCR(JCRSessionWrapper session) throws RepositoryException {
                    WorkflowDefinition definition = workflowService.getWorkflow("jBPM", Long.toString(workItem.getProcessInstanceId()), null).getWorkflowDefinition();
                    List<JahiaPrincipal> principals = workflowService.getAssignedRole(definition, taskName, Long.toString(workItem.getProcessInstanceId()), session);
                    for (JahiaPrincipal principal : principals) {
                        if (principal instanceof JahiaUser) {
                            if (((JahiaUser) principal).getUserKey().equals(finalUserKey)) {
                                return true;
                            }
                        } else if (principal instanceof JahiaGroup) {
                            JCRGroupNode groupNode = groupManagerService.lookupGroupByPath(principal.getLocalPath());
                            if (groupNode != null) {
                                for (JCRUserNode user : groupNode.getRecursiveUserMembers()) {
                                    if (user.getUserKey().equals(finalUserKey)) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                    return false;
                }
            });
            results.put("userHasTaskPermission", userKeyMatches);
        } catch (RepositoryException e) {
            logger.error("Error resolving roles and permissions for task {} and user {} : {}", taskName, userKey, e);
        }

        workItemManager.completeWorkItem(workItem.getId(), results);
    }

    @Override
    public void abortWorkItem(WorkItem workItem, WorkItemManager workItemManager) {
        logger.info("abortWorkItem");
    }

}

