import { home } from '../page-object/home.page'
import { workflowPage } from '../page-object/workflow.page'

describe('Reviewer test reject', () => {
    before(async function () {
        await home.prepareContentForTest()
        home.publishContentAsEditorAndValidate()
        cy.request({
            url: `${Cypress.env('MAILHOG_URL')}/api/v1/messages`,
            method: 'DELETE',
        })
        home.logout()
    })

    it('Logins as a reviewer, checks buttons and readonly date and rejects the publication', function () {
        workflowPage.openWorkflowAsReviewerAndVerifyButtons()
        workflowPage.getByText('button', 'Reject').click()
    })

    it('Received an rejected validation email at jahia.reviewer@test.com', function () {
        workflowPage.validateEmailReceivedWithCorrectSubject(
            `${Cypress.env('MAILHOG_URL')}/api/v2/search`,
            'jahia.editor@test.com',
            'Publication rejected by Ace Ventura for Digitall',
        )
    })

    after(function () {
        workflowPage.logout()
    })
})
