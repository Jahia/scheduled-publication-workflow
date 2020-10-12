package org.jahia.modules.workflows.scheduled;

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

@Component(immediate=true)
public class DelayedPublishWorkItemHandler implements WorkItemHandler {

    private static final Logger logger = LoggerFactory.getLogger(DelayedPublishWorkItemHandler.class);

    private WorkflowService workflowService;

    @Reference
    public void setWorkflowService(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @Activate
    public void start(BundleContext bundleContext) throws Exception {
        logger.info("Registering custom work item handler");
        JBPM6WorkflowProvider workflowProvider = (JBPM6WorkflowProvider) workflowService.getProviders().get("jBPM");
        workflowProvider.registerWorkItemHandler("Delayed publish", this);
    }

    @Deactivate
    public void stop(BundleContext bundleContext) throws Exception {
        logger.info("Un-registering custom work item handler");
        JBPM6WorkflowProvider workflowProvider = (JBPM6WorkflowProvider) workflowService.getProviders().get("jBPM");
        workflowProvider.unregisterWorkItemHandler("Delayed publish");
    }

    @Override
    public void executeWorkItem(WorkItem workItem, WorkItemManager workItemManager) {
        logger.info("executeWorkItem");
        workItemManager.completeWorkItem(workItem.getId(), null);
    }

    @Override
    public void abortWorkItem(WorkItem workItem, WorkItemManager workItemManager) {
        logger.info("abortWorkItem");
    }

}

