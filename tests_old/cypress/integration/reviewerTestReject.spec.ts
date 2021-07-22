import { home } from '../page-object/home.page'
import { workflowPage } from '../page-object/workflow.page'
import * as dayjs from 'dayjs'

const date = dayjs().add(1, 'day').format('DD.MM.YYYY HH:mm')

describe('Reviewer test reject', () => {
    before(async function () {
        await home.prepareContentForTest('/sites/digitall', 'test-content-one', 'Nice test content')
        await home.requestPublicationOfContentAsEditor(date)
        home.logout()
    })

    it('Logins as a reviewer, checks buttons and readonly date and rejects the publication', function () {
        workflowPage.openWorkflowAsReviewerAndVerifyButtons()
        workflowPage.cleanUpEmails()
        workflowPage.getByText('button', 'Reject').click()
    })

    it(
        'Received an rejected validation email at jahia.editor@test.com',
        { retries: { openMode: 5, runMode: 5 } },
        function () {
            workflowPage.validateEmailReceivedWithCorrectSubject(
                `${Cypress.env('MAILHOG_URL')}/api/v2/search`,
                'jahia.editor@test.com',
                'Publication rejected by Ace Ventura for Digitall',
            )
        },
    )

    after(function () {
        workflowPage.logout()
    })
})
