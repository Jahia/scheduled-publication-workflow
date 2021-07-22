/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-namespace */

// Load type definitions that come with Cypress module
/// <reference types="cypress" />

import { MutationOptions, QueryOptions } from '@apollo/client'
import { ApolloClient } from '@apollo/client/core'

declare global {
    namespace Cypress {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Chainable<Subject> {
            /**
             * Custom command to navigate to url with default authentication
             * @example cy.goTo('/start')
             */
            goTo(value: string, user?: authMethod): Chainable<Element>

            apolloQuery(apollo: ApolloClient<any>, options: QueryOptions): Chainable<any>

            apolloMutate(apollo: ApolloClient<any>, options: MutationOptions): Chainable<any>
        }
    }
}

interface authMethod {
    username: string
    password: string
}

Cypress.Commands.add('goTo', function (url: string, user?: authMethod) {
    if (user === undefined) {
        cy.visit(url, {
            auth: {
                username: 'root',
                password: Cypress.env('SUPER_USER_PASSWORD'),
            },
        })
    } else {
        cy.visit(url, {
            auth: {
                username: user.username,
                password: user.password,
            },
        })
    }

})

Cypress.Commands.add('apolloQuery', function (apollo: ApolloClient<any>, options: QueryOptions) {
    cy.log('GQL Query', options.query.loc.source.body)
    cy.wrap({}, { log: false })
        .then(() => apollo.query(options))
        .then(async (result) => {
            cy.log('Result', JSON.stringify(result))
            return result
        })
})

Cypress.Commands.add('apolloMutate', function (apollo: ApolloClient<any>, options: MutationOptions) {
    cy.log('GQL Mutation', options.mutation.loc.source.body)
    cy.wrap({}, { log: false })
        .then(() => apollo.mutate(options))
        .then(async (result) => {
            cy.log('Result', JSON.stringify(result))
            return result
        })
})
