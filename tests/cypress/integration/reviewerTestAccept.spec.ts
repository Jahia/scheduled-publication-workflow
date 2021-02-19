import { home } from '../page-object/home.page'
import { workflowPage } from '../page-object/workflow.page'
import * as dayjs from 'dayjs'

describe('Reviewer test accept', () => {
    before(async function () {
        await home.prepareContentForTest()
        home.publishContentAsEditorAndValidate()
        cy.log('deleting all messages')
        cy.request({
            url: `${Cypress.env('MAILHOG_URL')}/api/v1/messages`,
            method: 'DELETE',
        }).then(() => {
            cy.log('deleted all messages')
        })
        home.logout()
    })

    it('Logins as a reviewer, checks buttons and readonly date and accepts the publication', function () {
        workflowPage.openWorkflowAsReviewerAndVerifyButtons()
        workflowPage.getByText('button', 'Accept').click()
    })

    it(
        'Received an accepted validation email at jahia.reviewer@test.com',
        { retries: { openMode: 1, runMode: 2 } },
        function () {
            workflowPage.validateEmailReceivedWithCorrectSubject(
                `${Cypress.env('MAILHOG_URL')}/api/v2/search`,
                'jahia.reviewer@test.com',
                'Content validation by Ace Ventura for Digitall',
                dayjs().add(1, 'day').format('MMM DD, YYYY'),
            )
        },
    )

    after(function () {
        workflowPage.logout()
    })
})
