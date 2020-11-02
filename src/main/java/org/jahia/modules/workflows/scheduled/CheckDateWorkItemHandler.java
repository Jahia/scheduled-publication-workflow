package org.jahia.modules.workflows.scheduled;

import org.jahia.services.workflow.WorkflowService;
import org.jahia.services.workflow.WorkflowVariable;
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

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component(immediate=true)
public class CheckDateWorkItemHandler implements WorkItemHandler {

    private static final Logger logger = LoggerFactory.getLogger(CheckDateWorkItemHandler.class);
    private static final String TASK_NAME = "Check date valid";

    private WorkflowService workflowService;

    @Reference
    public void setWorkflowService(WorkflowService workflowService) {
        this.workflowService = workflowService;
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
        WorkflowVariable dateWorkflowVariable = (WorkflowVariable) vars.get("date");
        Date date = null;
        if (dateWorkflowVariable != null) {
            date = dateWorkflowVariable.getValueAsDate();
        }

        Date now = new Date();

        results.put("dateIsValid", date != null && date.after(now));

        workItemManager.completeWorkItem(workItem.getId(), results);

    }

    @Override
    public void abortWorkItem(WorkItem workItem, WorkItemManager manager) {
        logger.info("abortWorkItem");
    }
}
