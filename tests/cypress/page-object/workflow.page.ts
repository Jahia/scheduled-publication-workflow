import { BasePage } from './base.page'

class WorkflowPage extends BasePage {
    public static readonly SITE = 'digitall'
    public static readonly REVIEWER_USERNAME = 'ace'
    public static readonly REVIEWER_PASSWORD = 'ventura'

    goTo(user?: authMethod) {
        cy.goTo('/jahia/workflow', user)
        return cy
    }

    openWorkflowAsReviewerAndVerifyButtons() {
        this.login(WorkflowPage.REVIEWER_USERNAME, WorkflowPage.REVIEWER_PASSWORD, WorkflowPage.SITE)
        this.goTo({ username: WorkflowPage.REVIEWER_PASSWORD, password: WorkflowPage.REVIEWER_PASSWORD })
        this.getByText('label', 'en - Default started by editor').should(this.BE_VISIBLE)
        cy.get('.x-tree3-node-joint').click()
        this.getByText('button', 'Review').should(this.BE_VISIBLE).click()
        this.getByText('button', 'Reject').should(this.BE_VISIBLE)
        this.getByText('button', 'Accept').should(this.BE_VISIBLE)
        this.getByText('button', 'Publish now').should(this.BE_VISIBLE)
        this.getByText('button', 'Cancel').should(this.BE_VISIBLE)
        cy.get('input[name=date]').should(this.BE_VISIBLE)
        cy.get('input[name=date]').should('have.attr', 'readonly')
    }
}

export const workflowPage = new WorkflowPage()
