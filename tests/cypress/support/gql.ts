/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import { ApolloClient, NormalizedCacheObject } from '@apollo/client/core'
import Chainable = Cypress.Chainable
import { apollo } from './apollo'
import gql from 'graphql-tag'

export function getRootClient(): ApolloClient<NormalizedCacheObject> {
    return apollo(Cypress.config().baseUrl, {
        username: 'root',
        password: Cypress.env('SUPER_USER_PASSWORD'),
    })
}

export const deleteNode = (
    pathOrId: string,
    apolloClient: ApolloClient<NormalizedCacheObject> = apollo(Cypress.config().baseUrl, {
        username: 'root',
        password: Cypress.env('SUPER_USER_PASSWORD'),
    }),
): Chainable<any> => {
    return cy.apolloMutate(apolloClient, {
        variables: {
            pathOrId: pathOrId,
        },
        errorPolicy: 'all',
        mutation: gql`
            mutation ($pathOrId: String!) {
                jcr(workspace: EDIT) {
                    deleteNode(pathOrId: $pathOrId)
                }
            }
        `,
    })
}

export const getActiveUserWorkflow = (
    apolloClient: ApolloClient<NormalizedCacheObject> = apollo(Cypress.config().baseUrl),
): Chainable<any> => {
    const activeUserWorkflowQuery = require(`graphql-tag/loader!../fixtures/activeUserWorkflow.graphql`)
    return cy.apolloQuery(apolloClient, {
        query: activeUserWorkflowQuery,
    })
}

export const abortWorkflows = (
    apolloClient: ApolloClient<NormalizedCacheObject> = apollo(Cypress.config().baseUrl, {
        username: 'root',
        password: Cypress.env('SUPER_USER_PASSWORD'),
    }),
): Chainable<any> => {
    return cy.apolloMutate(apolloClient, {
        errorPolicy: 'all',
        mutation: gql`
            mutation {
                mutateWorkflows(definition: "jBPM:default-workflow") {
                    abortWorkflow
                    workflow {
                        startUser
                    }
                }
            }
        `,
    })
}

export const clearAllLocks = (
    pathOrId: string,
    apolloClient: ApolloClient<NormalizedCacheObject> = apollo(Cypress.config().baseUrl, {
        username: 'root',
        password: Cypress.env('SUPER_USER_PASSWORD'),
    }),
): Chainable<any> => {
    return cy.apolloMutate(apolloClient, {
        errorPolicy: 'all',
        mutation: gql`
            mutation ($pathOrId: String!) {
                jcr(workspace: EDIT) {
                    mutateNode(pathOrId: $pathOrId) {
                        clearAllLocks
                    }
                }
            }
        `,
    })
}

export const getNode = (
    pathOrId: string,
    apolloClient: ApolloClient<NormalizedCacheObject> = apollo(Cypress.config().baseUrl, {
        username: 'root',
        password: Cypress.env('SUPER_USER_PASSWORD'),
    }),
): Chainable<any> => {
    return cy.apolloQuery(apolloClient, {
        query: gql`
            query ($pathOrId: String!) {
                jcr(workspace: EDIT) {
                    nodeByPath(path: $pathOrId) {
                        uuid
                    }
                }
            }
        `,
        variables: {
            path: pathOrId,
        },
        errorPolicy: 'all',
        fetchPolicy: 'network-only',
    })
}

export const addRichTextToPage = (
    contentName: string,
    pathOrId: string,
    contentText: string,
    apolloClient: ApolloClient<NormalizedCacheObject> = apollo(Cypress.config().baseUrl, {
        username: 'root',
        password: Cypress.env('SUPER_USER_PASSWORD'),
    }),
): Chainable<any> => {
    return cy.apolloMutate(apolloClient, {
        variables: {
            contentName: contentName,
            pathOrId: pathOrId,
            contentText: contentText,
        },
        errorPolicy: 'all',
        mutation: gql`
            mutation ($contentName: String!, $pathOrId: String!, $contentText: String!) {
                jcr(workspace: EDIT) {
                    addNode(parentPathOrId: $pathOrId, name: $contentName, primaryNodeType: "jnt:bigText") {
                        mutateProperty(name: "text") {
                            setValue(language: "en", value: $contentText)
                        }
                    }
                }
            }
        `,
    })
}
