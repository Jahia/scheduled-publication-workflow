/* eslint-disable @typescript-eslint/no-var-requires */
import { abortWorkflows, clearAllLocks, deleteNode, getNode, getRootClient } from '../support/gql'

export class BasePage {
    protected BE_VISIBLE = 'be.visible'
    public static readonly SITE = 'digitall'
    /**
     * Get any element of given type that contain given text
     * It does not require to be the direct element containing text
     * example: <span><div>mytext</div></span> getByText("span", "myText") will work
     * @param type of content to find
     * @param text to find
     */
    getByText(type: string, text: string): Cypress.Chainable {
        return cy.contains(type, text)
    }

    getIframeBody(): Cypress.Chainable {
        // get the iframe > document > body
        // and retry until the body element is not empty
        return (
            cy
                .get('iframe.gwt-Frame.window-iframe')
                .its('0.contentDocument.body')
                .should('not.be.empty')
                // wraps "body" DOM element to allow
                // chaining more Cypress commands, like ".find(...)"
                // https://on.cypress.io/wrap
                .then(cy.wrap)
        )
    }

    async prepareContentForTest(sitePath: string, contentName: string, contextText: string): Promise<void> {
        this.cleanUpEmails()
        const addRichTextToPage = require(`graphql-tag/loader!../fixtures/addRichTextToPage.graphql`)
        await abortWorkflows()
        await clearAllLocks(`${sitePath}/home`)
        await clearAllLocks(`${sitePath}/home/area-main/area/area/area/area-main/${contentName}`)
        await clearAllLocks(`${sitePath}/home/area-main/area/area/area/area-main`)
        await deleteNode(`${sitePath}/home/area-main/area/area/area/area-main/${contentName}`)
        const client = getRootClient()
        const newNodeMutation = await client.mutate({
            mutation: addRichTextToPage,
            variables: {
                name: contentName,
                path: `${sitePath}/home/area-main/area/area/area/area-main`,
                text: contextText,
            },
            errorPolicy: 'all',
            fetchPolicy: 'no-cache',
        })
        expect(newNodeMutation.errors).to.be.undefined
        console.log(`${sitePath}/home/area-main/area/area/area/area-main/${contentName}`)
        const newContentNode = await getNode(`${sitePath}/home/area-main/area/area/area/area-main/${contentName}`)
        expect(newContentNode.jcr.nodeByPath.uuid).not.to.be.undefined
    }

    validateEmailReceivedWithCorrectSubject(
        url: string,
        to: string,
        subject: string,
        formattedScheduledDate?: string,
    ): Cypress.Chainable {
        return cy
            .request({
                url: url,
                qs: { kind: 'to', query: to },
            })
            .then((resp) => {
                expect(resp.status).to.eq(200)
                expect(resp.body.total).to.eq(1)
                expect(resp.body.items[0].Content.Headers.Subject[0]).to.eq(subject)
                if (formattedScheduledDate !== undefined) {
                    expect(resp.body.items[0].Content.Body).to.contain('The content is scheduled to be published on:')
                    expect(resp.body.items[0].Content.Body).to.contain(formattedScheduledDate)
                }
            })
    }

    cleanUpEmails(): void {
        cy.log('deleting all messages')
        cy.request({
            url: `${Cypress.env('MAILHOG_URL')}/api/v1/messages`,
            method: 'DELETE',
        }).then(() => {
            cy.log('deleted all messages')
        })
    }

    logout(): void {
        cy.visit({
            url: '/cms/logout',
            method: 'GET',
            qs: {
                redirect: '/sites/digitall/home.html',
            },
        })
    }

    login(username: string, password: string, site: string): void {
        cy.visit({
            url: '/cms/login',
            method: 'POST',
            body: {
                site: site,
                username: username,
                password: password,
                useCookie: 'on',
            },
        })
    }
}
