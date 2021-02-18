import { home } from '../page-object/home.page'
import { apolloClient } from '../support/apollo'
import { DocumentNode } from 'graphql'
import { abortWorkflows, clearAllLocks, deleteNode } from '../support/gql'
import * as dayjs from 'dayjs'

describe('Editor Test', () => {
    let addRichTextToPage: DocumentNode

    before(async function () {
        cy.request({
            url: `${Cypress.env('MAILHOG_URL')}/api/v1/messages`,
            method: 'DELETE',
        })
        addRichTextToPage = require(`graphql-tag/loader!../fixtures/addRichTextToPage.graphql`)
        await abortWorkflows()
        await clearAllLocks('/sites/digitall/home')
        await deleteNode('/sites/digitall/home/area-main/area/area/area/area-main/editor-new-content')
        const client = apolloClient()
        await client.mutate({
            mutation: addRichTextToPage,
            variables: {
                name: 'editor-new-content',
                path: '/sites/digitall/home/area-main/area/area/area/area-main',
                text: 'New Content Created By Editor',
            },
            errorPolicy: 'ignore',
        })
    })

    after(function () {
        cy.visit({
            url: '/cms/logout',
            method: 'GET',
            qs: {
                redirect: '/sites/digitall/home.html',
            },
        })
    })

    it('navigates to the homepage and click on Publish Page successfully', function () {
        cy.visit({
            url: '/cms/login',
            method: 'POST',
            body: {
                site: 'digitall',
                username: 'editor',
                password: 'editor',
                useCookie: 'on',
            },
        })
        home.goTo({ username: 'editor', password: 'editor' })
        home.getIframeBody().contains('global network', { matchCase: false }).should('be.visible')
        home.getIframeBody().get('.toolbar-item-publishone.action-bar-tool-item').click()
        const workflowactiondialog = home.getIframeBody().get('.workflowactiondialog-card')
        workflowactiondialog.get('input[name="date"]').should('be.visible')
        workflowactiondialog.get('input[name="date"]').type(dayjs().add(5, 'minute').format('DD.MM.YYYY HH:mm'))
        workflowactiondialog
            .get('.x-panel-bbar')
            .contains('Request publication', { matchCase: false })
            .should('be.visible')
            .click()
    })

    it('Received an email at jahia.editor@test.com', function () {
        cy.request({
            url: `${Cypress.env('MAILHOG_URL')}/api/v2/search`,
            qs: { kind: 'to', query: 'jahia.editor@test.com' },
        }).then((resp) => {
            expect(resp.status).to.eq(200)
            expect(resp.body.total).to.eq(1)
            expect(resp.body.items[0].Content.Headers.Subject[0]).to.eq(
                'Validation request by Editor Test prior to publication on Digitall',
            )
        })
    })
})
