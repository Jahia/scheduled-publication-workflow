import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject } from 'apollo-client-preset'

interface authMethod {
    token?: string
    username?: string
    password?: string
}

export const apolloClient = (authMethod?: authMethod): ApolloClient<NormalizedCacheObject> => {
    const headers: { authorization?: string } = {}
    if (authMethod === undefined) {
        headers.authorization = `Basic ${btoa(Cypress.env('JAHIA_USERNAME') + ':' + Cypress.env('JAHIA_PASSWORD'))}`
    } else if (authMethod.token !== undefined) {
        headers.authorization = `APIToken ${authMethod.token}`
    } else if (authMethod.username !== undefined && authMethod.password !== undefined) {
        headers.authorization = `Basic ${btoa(authMethod.username + ':' + authMethod.password)}`
    }

    return new ApolloClient({
        link: new HttpLink({
            uri: `${Cypress.config().baseUrl}/modules/graphql`,
            headers,
        }),
        cache: new InMemoryCache(),
        defaultOptions: {
            query: {
                fetchPolicy: 'no-cache',
            },
        },
    })
}
