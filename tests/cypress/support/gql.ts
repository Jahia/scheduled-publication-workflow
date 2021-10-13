/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import gql from 'graphql-tag'
import { apolloClient } from './apollo'
import { ApolloClient, NormalizedCacheObject } from 'apollo-client-preset'

const rootClient = apolloClient()

export function getRootClient(): ApolloClient<NormalizedCacheObject> {
    return rootClient
}

export async function deleteNode(path: string): Promise<any> {
    const response = await rootClient.mutate({
        mutation: gql`
            mutation ($path: String!) {
                jcr(workspace: EDIT) {
                    deleteNode(pathOrId: $path)
                }
            }
        `,
        variables: {
            path,
        },
        errorPolicy: 'ignore',
    })
    return response.data
}

export async function getActiveUserWorkflow(userClient: ApolloClient<NormalizedCacheObject>): Promise<any> {
    const activeUserWorkflowQuery = require(`graphql-tag/loader!../fixtures/activeUserWorkflow.graphql`)
    const response = await userClient.query({
        query: activeUserWorkflowQuery,
    })
    return response.data
}

export async function abortWorkflows(): Promise<any> {
    const response = await rootClient.mutate({
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
        errorPolicy: 'ignore',
    })
    return response.data
}

export async function clearAllLocks(path: string): Promise<any> {
    const response = await rootClient.mutate({
        mutation: gql`
            mutation ($path: String!) {
                jcr(workspace: EDIT) {
                    mutateNode(pathOrId: $path) {
                        clearAllLocks
                    }
                }
            }
        `,
        variables: {
            path: path,
        },
        errorPolicy: 'ignore',
    })
    return response.data
}

export async function getNode(path: string): Promise<any> {
    const response = await rootClient.query({
        query: gql`
            query ($path: String!) {
                jcr(workspace: EDIT) {
                    nodeByPath(path: $path) {
                        uuid
                    }
                }
            }
        `,
        variables: {
            path: path,
        },
        errorPolicy: 'all',
        fetchPolicy: 'network-only',
    })
    return response.data
}
