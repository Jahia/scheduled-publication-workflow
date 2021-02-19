/* eslint-disable @typescript-eslint/no-var-requires */
import { abortWorkflows, clearAllLocks, deleteNode } from '../support/gql'
import { apolloClient } from '../support/apollo'

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

    assertElementVisibleBySelector(selector: string): Cypress.Chainable {
        return cy.get(selector).should(this.BE_VISIBLE)
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

    async prepareContentForTest(): Promise<void> {
        cy.request({
            url: `${Cypress.env('MAILHOG_URL')}/api/v1/messages`,
            method: 'DELETE',
        })
        const addRichTextToPage = require(`graphql-tag/loader!../fixtures/addRichTextToPage.graphql`)
        await abortWorkflows()
        await clearAllLocks('/sites/digitall/home')
        await deleteNode('/sites/digitall/home/area-main/area/area/area/area-main/editor-new-content')
        const client = apolloClient()
        await client.mutate({
            mutation: addRichTextToPage,
            variables: {
                name: 'editor-new-content',
                path: '/sites/digitall/home/area-main/area/area/area/area-main',
                text: 'New Content Created By Editor',
            },
            errorPolicy: 'ignore',
        })
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
