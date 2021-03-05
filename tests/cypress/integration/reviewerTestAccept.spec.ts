import { home } from '../page-object/home.page'
import { workflowPage } from '../page-object/workflow.page'
import * as dayjs from 'dayjs'

const date = dayjs().add(1, 'day').format('DD.MM.YYYY HH:mm')

describe('Reviewer test accept', () => {
    before(async function () {
        await home.prepareContentForTest('/sites/digitall', 'test-content-one', 'Nice test content')
        home.requestPublicationOfContentAsEditor(date)
        home.logout()
    })

    it('Logins as a reviewer, checks buttons and readonly date and accepts the publication', function () {
        workflowPage.openWorkflowAsReviewerAndVerifyButtons()
        workflowPage.cleanUpEmails()
        workflowPage.getByText('button', 'Validate').click()
    })

    it(
        'Received an accepted validation email at jahia.reviewer@test.com',
        { retries: { openMode: 5, runMode: 5 } },
        function () {
            cy.request({
                url: `${Cypress.env('MAILHOG_URL')}/api/v2/search`,
                qs: { kind: 'to', query: 'jahia.reviewer@test.com' },
            }).then((resp) => {
                expect(resp.status).to.eq(200)
                expect(resp.body.total).to.eq(2)
                expect(resp.body.items[1].Content.Headers.Subject[0]).to.eq(
                    'Content validation by Ace Ventura for Digitall',
                )
                expect(resp.body.items[0].Content.Body).to.contain('The content is scheduled to be published on:')
                expect(resp.body.items[0].Content.Body).to.contain(dayjs().add(1, 'day').format('MMM D, YYYY'))
            })
        },
    )

    after(function () {
        workflowPage.logout()
    })
})
