import { home } from '../page-object/home.page'
import * as dayjs from 'dayjs'

const EDITOR_NAME_AND_PASSWORD = 'editor'
const SITE = 'digitall'
describe('Editor Test', () => {
    before(async function () {
        await home.prepareContentForTest('/sites/digitall', 'test-content-one', 'Nice test content')
    })

    after(function () {
        home.logout()
    })

    it('navigates to the homepage and click on Publish Page successfully', function () {
        home.login(EDITOR_NAME_AND_PASSWORD, EDITOR_NAME_AND_PASSWORD, SITE)
        home.goTo({ username: EDITOR_NAME_AND_PASSWORD, password: EDITOR_NAME_AND_PASSWORD })
        home.getIframeBody().contains('global network', { matchCase: false }).should('be.visible')
        home.getIframeBody().get('.toolbar-item-publishone.action-bar-tool-item').click()
        const workflowactiondialog = home.getIframeBody().get('.workflowactiondialog-card')
        workflowactiondialog.get('input[name="scheduledDate"]').should('be.visible')
        workflowactiondialog.get('input[name="scheduledDate"]').type(dayjs().add(1, 'day').format('DD.MM.YYYY HH:mm'))
        workflowactiondialog
            .get('.x-panel-bbar')
            .contains('Request publication', { matchCase: false })
            .should('be.visible')
            .click()
        home.goTo({ username: EDITOR_NAME_AND_PASSWORD, password: EDITOR_NAME_AND_PASSWORD })
    })

    it('Received an email at jahia.editor@test.com', { retries: { openMode: 1, runMode: 2 } }, function () {
        home.validateEmailReceivedWithCorrectSubject(
            `${Cypress.env('MAILHOG_URL')}/api/v2/search`,
            'jahia.editor@test.com',
            'Validation request by Editor Test prior to publication on Digitall',
            dayjs().add(1, 'day').format('MMM DD, YYYY'),
        )
    })
})
