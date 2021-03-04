import { BasePage } from './base.page'
import * as dayjs from 'dayjs'
import { home } from './home.page'

class WorkflowPage extends BasePage {
    public static readonly SITE = 'digitall'
    public static readonly REVIEWER_USERNAME = 'ace'
    public static readonly REVIEWER_PASSWORD = 'ventura'
    public static readonly CHIEF_USERNAME = 'john'
    public static readonly CHIEF_PASSWORD = 'mcclane'
    private static readonly SCHEDULED_DATE_INPUT = 'input[name=scheduledDate]'

    goTo(user?: authMethod) {
        cy.goTo('/jahia/workflow', user)
        return cy
    }

    openWorkflowAsReviewerAndVerifyButtons() {
        this.login(WorkflowPage.REVIEWER_USERNAME, WorkflowPage.REVIEWER_PASSWORD, WorkflowPage.SITE)
        this.goTo({ username: WorkflowPage.REVIEWER_PASSWORD, password: WorkflowPage.REVIEWER_PASSWORD })
        this.getByText('label', 'en - Scheduled publication workflow started by editor').should(this.BE_VISIBLE)

        cy.get('.x-tree3-node-joint').click()
        this.getByText('button', 'Publication review').should(this.BE_VISIBLE).click()
        this.getByText('button', 'Reject').should(this.BE_VISIBLE)
        this.getByText('button', 'Validate').should(this.BE_VISIBLE)
        this.getByText('button', 'Publish now').should(this.BE_VISIBLE)
        this.getByText('button', 'Cancel').should(this.BE_VISIBLE)
        cy.get(WorkflowPage.SCHEDULED_DATE_INPUT).should(this.BE_VISIBLE)
        cy.get(WorkflowPage.SCHEDULED_DATE_INPUT).should('have.attr', 'readonly')
    }

    openWorkflowAsEditorInChiefAndVerifyButtons(scheduled: boolean, abort: boolean) {
        this.login(WorkflowPage.CHIEF_USERNAME, WorkflowPage.CHIEF_PASSWORD, WorkflowPage.SITE)
        this.goTo({ username: WorkflowPage.CHIEF_USERNAME, password: WorkflowPage.CHIEF_PASSWORD })
        this.getByText('label', 'en - Scheduled publication workflow started by editor').should(this.BE_VISIBLE)
        cy.get('.x-tree3-node-joint').click()
        const actionButtonLabel = scheduled ? 'Reschedule' : 'Schedule publication'
        this.getByText('button', actionButtonLabel).should(this.BE_VISIBLE).click()
        if (scheduled) {
            this.validateRescheduleButtons()
        } else {
            this.validateScheduleButtons()
        }
        cy.get(WorkflowPage.SCHEDULED_DATE_INPUT)
            .should(this.BE_VISIBLE)
            .clear({ force: true })
            .type(dayjs().add(2, 'day').format('DD.MM.YYYY HH:mm'), { force: true })

        if (abort) {
            this.getByText('button', 'Abort publication').should(this.BE_VISIBLE).click()
        } else {
            cy.get('#workflow-dashboard-publication-window')
                .contains('button', actionButtonLabel)
                .should(this.BE_VISIBLE)
                .click()
        }
    }

    publishNowAsEditorInChief() {
        this.login(WorkflowPage.CHIEF_USERNAME, WorkflowPage.CHIEF_PASSWORD, WorkflowPage.SITE)
        this.goTo({ username: WorkflowPage.CHIEF_USERNAME, password: WorkflowPage.CHIEF_PASSWORD })
        this.getByText('label', 'en - Scheduled publication workflow started by editor').should(this.BE_VISIBLE)
        cy.get('.x-tree3-node-joint').click()
        this.getByText('button', 'Schedule publication').should(this.BE_VISIBLE).click()
        this.getByText('button', 'Publish now').should(this.BE_VISIBLE).click()
    }

    private validateScheduleButtons() {
        this.getByText('button', 'Publish now').should(this.BE_VISIBLE)
        this.getByText('button', 'Abort publication').should(this.BE_VISIBLE)
        cy.get('#workflow-dashboard-publication-window')
            .contains('button', 'Schedule publication')
            .should(this.BE_VISIBLE)
    }

    private validateRescheduleButtons() {
        this.getByText('button', 'Publish now').should(this.BE_VISIBLE)
        this.getByText('button', 'Cancel').should(this.BE_VISIBLE)
    }

    async requestPublicationAndValidateContent(date?: string) {
        await home.prepareContentForTest('/sites/digitall', 'test-content-one', 'Nice test content')
        home.requestPublicationOfContentAsEditor(date)
        this.logout()
        workflowPage.openWorkflowAsReviewerAndVerifyButtons()
        workflowPage.cleanUpEmails()
        workflowPage.getByText('button', 'Validate').click()
        workflowPage.logout()
        workflowPage.cleanUpEmails()
    }
}

export const workflowPage = new WorkflowPage()
