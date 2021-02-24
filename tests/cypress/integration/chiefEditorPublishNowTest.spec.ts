import { workflowPage } from '../page-object/workflow.page'

describe('Editor in chief publish now test', () => {
    before(async function () {
        await workflowPage.requestPublicationAndValidateContent()
    })

    it('Logins as a editor in chief, goes to the workflow dashboard and publishes content', function () {
        workflowPage.cleanUpEmails()
        workflowPage.publishNowAsEditorInChief()
    })

    it(
        'Received a content published email at jahia.editor@test.com',
        { retries: { openMode: 5, runMode: 5 } },
        function () {
            workflowPage.validateEmailReceivedWithCorrectSubject(
                `${Cypress.env('MAILHOG_URL')}/api/v2/search`,
                'jahia.editor@test.com',
                'Content has been published on Digitall',
            )
        },
    )

    after(function () {
        workflowPage.logout()
    })
})
