/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import gql from 'graphql-tag'
import { apolloClient } from './apollo'
import { ApolloClient, NormalizedCacheObject } from 'apollo-client-preset'

export async function deleteNode(path: string): Promise<any> {
    const client = apolloClient()
    const response = await client.mutate({
        mutation: gql`
            mutation($path: String!) {
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

export async function getActiveUserWorkflow(apolloClient: ApolloClient<NormalizedCacheObject>): Promise<any> {
    const activeUserWorkflowQuery = require(`graphql-tag/loader!../fixtures/activeUserWorkflow.graphql`)
    const response = await apolloClient.query({
        query: activeUserWorkflowQuery,
    })
    return response.data
}

export async function abortWorkflows(): Promise<any> {
    const client = apolloClient()
    const response = await client.mutate({
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
    const client = apolloClient()
    const response = await client.mutate({
        mutation: gql`
            mutation($path: String!) {
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
