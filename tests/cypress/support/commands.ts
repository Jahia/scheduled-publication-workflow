// Load type definitions that come with Cypress module
/// <reference types="cypress" />

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable {
        /**
         * Custom command to navigate to url with default authentication
         * @example cy.goTo('/start')
         */
        goTo(value: string, user?: authMethod): Chainable<Element>
    }
}

interface authMethod {
    username?: string
    password?: string
}

Cypress.Commands.add('goTo', function (url: string, authMethod?: authMethod) {
    if (authMethod === undefined) {
        cy.visit(url, {
            auth: {
                username: Cypress.env('JAHIA_USERNAME'),
                password: Cypress.env('JAHIA_PASSWORD'),
            },
        })
    } else if (authMethod.username !== undefined && authMethod.password !== undefined) {
        cy.visit(url, {
            auth: {
                username: authMethod.username,
                password: authMethod.password,
            },
        })
    }
})
