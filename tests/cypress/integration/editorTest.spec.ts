import { home } from '../page-object/home.page'
import { apolloClient } from '../support/apollo'
import { DocumentNode } from 'graphql'
import { deleteNode } from '../support/gql'
import * as dayjs from 'dayjs'

describe('Editor Test', () => {
    let addRichTextToPage: DocumentNode

    before(async function () {
        addRichTextToPage = require(`graphql-tag/loader!../fixtures/addRichTextToPage.graphql`)
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
})
