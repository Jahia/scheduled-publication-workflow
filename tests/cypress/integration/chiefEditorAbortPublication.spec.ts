import {workflowPage} from '../page-object/workflow.page';


describe('Editor in chief abort publication test', () => {
    before(async function () {
        await workflowPage.requestPublicationAndValidateContent();
    })

    it('Logins as a editor in chief, goes to the workflow dashboard and aborts the publication', function () {
        workflowPage.cleanUpEmails()
        workflowPage.openWorkflowAsEditorInChiefAndVerifyButtons(false, true)
    })

    it(
        'Receives a rejection email from John McClane at jahia.editor@test.com',
        { retries: { openMode: 5, runMode: 5 } },
        function () {
            workflowPage.validateEmailReceivedWithCorrectSubject(
                `${Cypress.env('MAILHOG_URL')}/api/v2/search`,
                'jahia.editor@test.com',
                'Publication rejected by John McClane for Digitall'
            )
        },
    )

    after(function () {
        workflowPage.logout()
    })
})
