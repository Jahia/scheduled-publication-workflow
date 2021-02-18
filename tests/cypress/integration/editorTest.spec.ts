import { home } from '../page-object/home.page'

describe('Editor Test', () => {
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
        home.getIframeBody().get('.workflowactiondialog-ctn').contains('Request publication', { matchCase: false })
    })
})
