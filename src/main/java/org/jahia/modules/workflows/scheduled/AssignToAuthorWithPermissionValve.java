package org.jahia.modules.workflows.scheduled;

import org.jahia.params.valves.BaseAuthValve;
import org.jahia.pipelines.Pipeline;
import org.jahia.pipelines.PipelineException;
import org.jahia.pipelines.valves.ValveContext;
import org.jahia.services.content.JCRTemplate;
import org.jahia.services.usermanager.JahiaUser;
import org.jahia.services.usermanager.JahiaUserManagerService;
import org.jahia.services.workflow.jbpm.custom.JahiaLocalHTWorkItemHandler;
import org.jbpm.services.task.impl.model.UserImpl;
import org.jbpm.workflow.instance.WorkflowProcessInstance;
import org.kie.api.runtime.KieSession;
import org.kie.api.runtime.process.WorkItem;
import org.kie.api.task.model.Task;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;

import javax.jcr.RepositoryException;

@Component(immediate=true)
public class AssignToAuthorWithPermissionValve extends BaseAuthValve {

    public static final String TASK_NAME = "schedule";
    public static final String PERMISSION = "author-publication-if-validated";

    private Pipeline pipeline;

    private JCRTemplate jcrTemplate;

    private JahiaUserManagerService jahiaUserManagerService;


    @Reference(service = Pipeline.class, target="(type=peopleAssignmentPipeline)")
    public void setPipeline(Pipeline pipeline) {
        this.pipeline = pipeline;
    }

    @Reference
    public void setJcrTemplate(JCRTemplate jcrTemplate) {
        this.jcrTemplate = jcrTemplate;
    }

    @Reference
    public void setJahiaUserManagerService(JahiaUserManagerService jahiaUserManagerService) {
        this.jahiaUserManagerService = jahiaUserManagerService;
    }

    @Activate
    public void activate() {
        setId("assignToAuthorWithPermission");
        removeValve(pipeline);
        addValve(pipeline, 10, null, null);
    }

    @Deactivate
    public void deactivate(BundleContext bundleContext) {
        removeValve(pipeline);
    }

    @Override
    public void invoke(Object context, ValveContext valveContext) throws PipelineException {
        JahiaLocalHTWorkItemHandler.PeopleAssignmentContext peopleAssignmentContext = (JahiaLocalHTWorkItemHandler.PeopleAssignmentContext) context;
        Task task = peopleAssignmentContext.getTask();

        String taskName = task.getNames().get(0).getText();

        if (taskName.equals(TASK_NAME)) {
            KieSession kieSession = peopleAssignmentContext.getKieSession();

            WorkItem workItem = peopleAssignmentContext.getWorkItem();

            WorkflowProcessInstance processInstance = (WorkflowProcessInstance) kieSession.getProcessInstance(workItem.getProcessInstanceId());
            String user = (String) processInstance.getVariable("user");

            JahiaUser jahiaUser = jahiaUserManagerService.lookupUserByPath(user).getJahiaUser();

            try {
                boolean hasPermission = jcrTemplate.doExecute(jahiaUser, null, null, session ->
                        session.getNodeByIdentifier((String) processInstance.getVariable("nodeId")).hasPermission(PERMISSION)
                );

                if (hasPermission) {
                    task.getPeopleAssignments().getPotentialOwners().add(new UserImpl(user));
                }
            } catch (RepositoryException e) {
                e.printStackTrace();
            }
        }
        valveContext.invokeNext(context);
    }
}
