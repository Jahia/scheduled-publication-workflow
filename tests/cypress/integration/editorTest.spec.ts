import { home } from '../page-object/home.page'

describe('navigation to user', () => {
    it('navigates to the users page successfully', function () {
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
        cy.contains('EDITOR TEST').should('be.visible')
    })
})
