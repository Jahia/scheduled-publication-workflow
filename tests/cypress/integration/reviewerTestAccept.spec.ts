import { home } from '../page-object/home.page'
import { workflowPage } from '../page-object/workflow.page'

describe('Reviewer test accept', () => {
    before(async function () {
        await home.prepareContentForTest()
        home.publishContentAsEditorAndValidate()
        cy.request({
            url: `${Cypress.env('MAILHOG_URL')}/api/v1/messages`,
            method: 'DELETE',
        })
        home.logout()
    })

    it('Logins as a reviewer, checks buttons and readonly date and accepts the publication', function () {
        workflowPage.openWorkflowAsReviewerAndVerifyButtons()
        workflowPage.getByText('button', 'Accept').click()
    })

    it('Received an accepted validation email at jahia.reviewer@test.com', function () {
        workflowPage.validateEmailReceivedWithCorrectSubject(
            `${Cypress.env('MAILHOG_URL')}/api/v2/search`,
            'jahia.reviewer@test.com',
            'Content validation by Ace Ventura for Digitall',
        )
    })

    after(function () {
        workflowPage.logout()
    })
})
