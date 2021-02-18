import gql from 'graphql-tag'
import { apolloClient } from './apollo'

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
