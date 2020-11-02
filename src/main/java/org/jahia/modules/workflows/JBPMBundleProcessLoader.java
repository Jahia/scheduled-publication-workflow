package org.jahia.modules.workflows;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.dom4j.*;
import org.dom4j.io.SAXReader;
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
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import java.io.*;
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

    private List<Resource> deployedWorkflowResources = new ArrayList<>();

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
        permissions.put("schedule", "publication-reschedule");
        permissions.put("reschedule", "publication-reschedule");
        workflowTypeRegistration.setPermissions(permissions);
        Map<String,String> forms = new HashMap<>();
        forms.put("start", "jnt:advancedPublishStart");
        forms.put("review", "jnt:advancedPublishReview");
        forms.put("schedule", "jnt:advancedPublishSchedule");
        forms.put("reschedule", "jnt:advancedPublishReschedule");
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

        SAXReader saxReader = new SAXReader();

        if (processes != null && processes.hasMoreElements()) {
            logger.info("Found workflow processes to be deployed.");

            while (processes.hasMoreElements()) {
                URL processURL = processes.nextElement();
                logger.info("Found workflow process " + processURL + ". Updating...");

                Document document = null;
                try {
                    document = saxReader.read(processURL);
                    Namespace xsiNamespace = document.getRootElement().getNamespaceForPrefix("xsi");
                    Namespace droolsNamespace = document.getRootElement().getNamespaceForPrefix("drools");
                    Namespace bpmn2Namespace = document.getRootElement().getNamespaceForPrefix("bpmn2");
                    removeSchemaLocations(document, xsiNamespace);
                    cleanAnyType(document.getRootElement(), xsiNamespace);
                    movePropertyDefinitions(document);
                    addDroolTaskNames(document, droolsNamespace, bpmn2Namespace);
                    String fileName = FilenameUtils.getName(processURL.getFile());
                    String extension = FilenameUtils.getExtension(fileName);

                    File tempXmlFile = File.createTempFile(FilenameUtils.getBaseName(processURL.getFile()), "." + extension);
                    logger.info("Saving transformed BPMN2 file to {}...", tempXmlFile);
                    FileWriter tempXmlFileWriter = new FileWriter(tempXmlFile);
                    document.write(tempXmlFileWriter);
                    tempXmlFileWriter.flush();
                    tempXmlFileWriter.close();

                    Resource workflowResource = new FileSystemResource(tempXmlFile);
                    deployedWorkflowResources.add(workflowResource);
                    jbpm6WorkflowProvider.addResource(workflowResource);
                    //jbpm6WorkflowProvider.addResource(new BundleResource(processURL, bundleContext.getBundle()));
                } catch (DocumentException e) {
                    logger.error("Error processing workflow process {}: {}", processURL, e);
                }
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

        if (deployedWorkflowResources.size() > 0) {
            logger.info("Found workflow processes to be undeployed.");
            for (Resource workflowResource : deployedWorkflowResources) {
                logger.info("Undeploy workflow process resource {}. Updating...", workflowResource);
                jbpm6WorkflowProvider.removeResource(workflowResource);
                if (workflowResource instanceof FileSystemResource) {
                    ((FileSystemResource) workflowResource).getFile().delete();
                }
                logger.info("... done");
            }
            if (JahiaContextLoaderListener.isContextInitialized()) {
                jbpm6WorkflowProvider.recompilePackages();
            }
            deployedWorkflowResources.clear();
            logger.info("...workflow processes undeployed.");
        }

        Enumeration<URL> processes = bundleContext.getBundle().findEntries("/", "*.bpmn2", true);
        if (processes != null && processes.hasMoreElements()) {

            while (processes.hasMoreElements()) {
                URL processURL = processes.nextElement();

                jbpm6WorkflowProvider.removeResource(new BundleResource(processURL, bundleContext.getBundle()));
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

    public void removeSchemaLocations(Document document, Namespace xsiNamespace) {
        Element rootElement = document.getRootElement();
        Attribute xsiSchemaLocation = rootElement.attribute(new QName("schemaLocation", xsiNamespace));
        xsiSchemaLocation.setValue("http://www.jboss.org/drools drools.xsd http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd");
    }

    public void cleanAnyType(Element element, Namespace xsiNamespace) {
        Attribute xsiType = element.attribute(new QName("type", xsiNamespace));
        if (xsiType != null && xsiType.getValue() != null && xsiType.getValue().equals("xs:anyType")) {
            element.remove(xsiType);
        }
        for (int i = 0, size = element.nodeCount(); i < size; i++) {
            Node node = element.node(i);
            if (node instanceof Element) {
                cleanAnyType((Element) node, xsiNamespace);
            }
        }
    }

    public void movePropertyDefinitions(Document document) {
        List<Node> processNodes = document.selectNodes("/bpmn2:definitions/bpmn2:process");
        for (Node processNode : processNodes) {
            Element processElement = (Element) processNode;
            Element extensionElements = (Element) processNode.selectSingleNode("bpmn2:extensionElements");
            List<Node> propertiesNodes = processNode.selectNodes("bpmn2:property");
            for (Node propertyNode : propertiesNodes) {
                processElement.elements().add(1, (Element) propertyNode.detach());
            }
        }
    }

    public void addDroolTaskNames(Document document, Namespace droolsNamespace, Namespace bpmn2Namespace) {
        QName droolsTaskNameAttr = new QName("taskName", droolsNamespace);
        List<Node> taskNodes = document.selectNodes("//bpmn2:process/bpmn2:task");
        for (Node taskNode : taskNodes) {
            Element taskElement = (Element) taskNode;
            if (taskElement.attribute(droolsTaskNameAttr) == null) {
                taskElement.addAttribute(droolsTaskNameAttr, taskElement.attributeValue("name"));
            }
        }
    }
}
