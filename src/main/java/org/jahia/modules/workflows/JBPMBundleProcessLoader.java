package org.jahia.modules.workflows;

import org.apache.commons.lang.StringUtils;
import org.apache.tika.io.IOUtils;
import org.jahia.bin.listeners.JahiaContextLoaderListener;
import org.jahia.osgi.BundleResource;
import org.jahia.services.templates.TemplatePackageRegistry;
import org.jahia.services.workflow.WorkflowService;
import org.jahia.services.workflow.WorklowTypeRegistration;
import org.jahia.services.workflow.jbpm.JBPM6WorkflowProvider;
import org.jahia.services.workflow.jbpm.custom.email.AddressTemplate;
import org.jahia.services.workflow.jbpm.custom.email.MailTemplate;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.*;

@Component(immediate=true)
public class JBPMBundleProcessLoader {

    private static final List<String> FIELDS = Arrays.asList("from", "to", "cc", "bcc",
            "from-users", "to-users", "cc-users", "bcc-users",
            "from-groups", "to-groups", "cc-groups", "bcc-groups",
            "subject", "text", "html", "language");

    private static final Logger logger = LoggerFactory.getLogger(JBPMBundleProcessLoader.class);

    private WorkflowService workflowService;
    private JBPM6WorkflowProvider jbpm6WorkflowProvider;
    private TemplatePackageRegistry templatePackageRegistry;

    private WorklowTypeRegistration defaultWorkflow;

    @Reference
    public void setWorkflowService(WorkflowService workflowService) {
        this.workflowService = workflowService;
        this.jbpm6WorkflowProvider = (JBPM6WorkflowProvider) workflowService.getProviders().get("jBPM");
    }

    @Reference
    public void setTemplatePackageRegistry(TemplatePackageRegistry templatePackageRegistry) {
        this.templatePackageRegistry = templatePackageRegistry;
    }

    @Activate
    public void start(BundleContext bundleContext) throws Exception {
        deployDeclaredProcesses(bundleContext);
        registerWorkflowTypes(bundleContext);
    }

    @Deactivate
    public void stop(BundleContext bundleContext) throws Exception {
        unregisterWorkflowTypes();
        undeployDeclaredProcesses(bundleContext);
    }

    private void registerWorkflowTypes(BundleContext bundleContext) {
        logger.info("Registering custom workflow types");
        defaultWorkflow = registerPublicationWorkflowType(bundleContext, "default-workflow");
    }

    private WorklowTypeRegistration registerPublicationWorkflowType(BundleContext bundleContext, String definitionName) {
        WorklowTypeRegistration workflowTypeRegistration = new WorklowTypeRegistration();
        workflowTypeRegistration.setType("publish");
        workflowTypeRegistration.setDefinition(definitionName);
        workflowTypeRegistration.setCanBeUsedForDefault(true);
        workflowTypeRegistration.setDefaultPriority(1);
        Map<String,String> permissions = new HashMap<>();
        permissions.put("start", "publication-start");
        permissions.put("review", "publication-review");
        permissions.put("bypass timer", "bypass-timer");
        workflowTypeRegistration.setPermissions(permissions);
        Map<String,String> forms = new HashMap<>();
        forms.put("start", "jnt:advancedPublish");
        forms.put("review", "jnt:advancedPublish");
        workflowTypeRegistration.setForms(forms);
        workflowTypeRegistration.setJahiaModule(templatePackageRegistry.lookupByBundle(bundleContext.getBundle()));
        workflowService.registerWorkflowType(workflowTypeRegistration);
        return workflowTypeRegistration;
    }

    private void unregisterWorkflowTypes() {
        logger.info("Un-registering custom workflow types");
        workflowService.unregisterWorkflowType(defaultWorkflow);
    }

    private void deployDeclaredProcesses(BundleContext bundleContext) throws IOException {
        Enumeration<URL> processes = bundleContext.getBundle().findEntries("/", "*.bpmn2", true);
        if (processes != null && processes.hasMoreElements()) {
            logger.info("Found workflow processes to be deployed.");

            while (processes.hasMoreElements()) {
                URL processURL = processes.nextElement();
                logger.info("Found workflow process " + processURL + ". Updating...");

                jbpm6WorkflowProvider.addResource(new BundleResource(processURL, bundleContext.getBundle()));
                logger.info("... done");
            }
            logger.info("...workflow processes deployed.");
            if (jbpm6WorkflowProvider.isInitialized()) {
                jbpm6WorkflowProvider.recompilePackages();
            }
        }
        Enumeration<URL> mailTemplates = bundleContext.getBundle().findEntries("/", "*.mail", true);
        if (mailTemplates != null && mailTemplates.hasMoreElements()) {
            logger.info("Found workflow mail templates to be deployed.");

            while (mailTemplates.hasMoreElements()) {
                Resource mailTemplateResource = new BundleResource(mailTemplates.nextElement(), bundleContext.getBundle());
                MailTemplate mailTemplate = new MailTemplate();
                mailTemplate.setLanguage("velocity");
                mailTemplate.setFrom(new AddressTemplate());
                mailTemplate.setTo(new AddressTemplate());
                mailTemplate.setCc(new AddressTemplate());
                mailTemplate.setBcc(new AddressTemplate());

                int currentField = -1;
                String currentLine;
                StringBuilder buf = new StringBuilder();
                BufferedReader reader = new BufferedReader(new InputStreamReader(mailTemplateResource.getInputStream(), "UTF-8"));
                try {
                    while ((currentLine = reader.readLine()) != null) {
                        if (currentLine.contains(":")) {
                            String prefix = StringUtils.substringBefore(currentLine, ":").toLowerCase();
                            if (FIELDS.contains(prefix)) {
                                setMailTemplateField(mailTemplate, currentField, buf);
                                buf = new StringBuilder();
                                currentField = FIELDS.indexOf(prefix);
                                currentLine = StringUtils.substringAfter(currentLine, ":").trim();
                            }
                        } else {
                            buf.append('\n');
                        }
                        buf.append(currentLine);
                    }
                } finally {
                    IOUtils.closeQuietly(reader);
                }
                setMailTemplateField(mailTemplate, currentField, buf);
                // mailTemplateRegistry.addTemplate(StringUtils.substringBeforeLast(mailTemplateResource.getFilename(), "."), mailTemplate);
            }
        }
    }

    public static void setMailTemplateField(MailTemplate t, int currentField, StringBuilder buf) {
        switch (currentField) {
            case 0:
                t.getFrom().setAddresses(buf.toString());
                break;
            case 1:
                t.getTo().setAddresses(buf.toString());
                break;
            case 2:
                t.getCc().setAddresses(buf.toString());
                break;
            case 3:
                t.getBcc().setAddresses(buf.toString());
                break;
            case 4:
                t.getFrom().setUsers(buf.toString());
                break;
            case 5:
                t.getTo().setUsers(buf.toString());
                break;
            case 6:
                t.getCc().setUsers(buf.toString());
                break;
            case 7:
                t.getBcc().setUsers(buf.toString());
                break;
            case 8:
                t.getFrom().setGroups(buf.toString());
                break;
            case 9:
                t.getTo().setGroups(buf.toString());
                break;
            case 10:
                t.getCc().setGroups(buf.toString());
                break;
            case 11:
                t.getBcc().setGroups(buf.toString());
                break;
            case 12:
                t.setSubject(buf.toString());
                break;
            case 13:
                t.setText(buf.toString());
                break;
            case 14:
                t.setHtml(buf.toString());
                break;
            case 15:
                t.setLanguage(buf.toString());
                break;
        }
    }

    private void undeployDeclaredProcesses(BundleContext bundleContext) throws IOException {
        if (!JahiaContextLoaderListener.isRunning()) {
            return;
        }

        Enumeration<URL> processes = bundleContext.getBundle().findEntries("/", "*.bpmn2", true);
        if (processes != null && processes.hasMoreElements()) {
            logger.info("Found workflow processes to be undeployed.");

            while (processes.hasMoreElements()) {
                URL processURL = processes.nextElement();
                logger.info("Undeploy workflow process " + processURL + ". Updating...");

                jbpm6WorkflowProvider.removeResource(new BundleResource(processURL, bundleContext.getBundle()));
                logger.info("... done");
            }
            logger.info("...workflow processes undeployed.");
            if (JahiaContextLoaderListener.isContextInitialized()) {
                jbpm6WorkflowProvider.recompilePackages();
            }
        }
        Enumeration<URL> mailTemplates = bundleContext.getBundle().findEntries("/", "*.mail", true);
        if (mailTemplates != null && mailTemplates.hasMoreElements()) {
            logger.info("Found workflow mail templates to be undeployed.");

            while (mailTemplates.hasMoreElements()) {
                Resource mailTemplateResource = new BundleResource(mailTemplates.nextElement(), bundleContext.getBundle());
                // mailTemplateRegistry.removeTemplate(StringUtils.substringBeforeLast(mailTemplateResource.getFilename(), "."));
            }
        }

    }

}
