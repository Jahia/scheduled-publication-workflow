import {workflowPage} from '../page-object/workflow.page';
import * as dayjs from 'dayjs';


describe('Editor in chief reschedule test', () => {
    before(async function () {
        await workflowPage.requestPublicationAndValidateContent(dayjs().add(1, 'day').format('DD.MM.YYYY HH:mm'));
    })

    it('Logins as a editor in chief, goes to the workflow dashboard and successfully reschedules', function () {
        workflowPage.cleanUpEmails()
        workflowPage.openWorkflowAsEditorInChiefAndVerifyButtons(true, false)
    })

    it(
        'Received an accepted validation email at jahia.chief@test.com',
        { retries: { openMode: 5, runMode: 5 } },
        function () {
            workflowPage.validateEmailReceivedWithCorrectSubject(
                `${Cypress.env('MAILHOG_URL')}/api/v2/search`,
                'jahia.chief@test.com',
                'Validated content is ready for publication on Digitall',
                dayjs().add(2, 'day').format('MMM DD, YYYY'),
            )
        },
    )

    after(function () {
        workflowPage.logout()
    })
})
