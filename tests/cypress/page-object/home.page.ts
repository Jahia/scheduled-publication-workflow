import {BasePage} from './base.page';

class HomePage extends BasePage {
    public static readonly EDITOR_NAME_AND_PASSWORD = 'editor'

    goTo(user?: authMethod) {
        cy.goTo('/sites/digitall/home.html', user)
        cy.goTo('/cms/edit/default/en/sites/digitall/home.html?redirect=false', user)
        return cy
    }

    requestPublicationOfContentAsEditor(date?: string) {
        this.login(HomePage.EDITOR_NAME_AND_PASSWORD, HomePage.EDITOR_NAME_AND_PASSWORD, BasePage.SITE)
        home.goTo({ username: HomePage.EDITOR_NAME_AND_PASSWORD, password: HomePage.EDITOR_NAME_AND_PASSWORD })
        home.getIframeBody().contains('global network', { matchCase: false }).should(this.BE_VISIBLE)
        home.getIframeBody().get('.toolbar-item-publishone.action-bar-tool-item').click()
        const workflowactiondialog = home.getIframeBody().get('.workflowactiondialog-card')
        if (date) {
            workflowactiondialog.get('input[name="scheduledDate"]').type(date)
        } else {
            workflowactiondialog.get('input[name="jcr:title"]').invoke('val').should('contain', 'en - Default started by editor')
        }
        workflowactiondialog
            .get('.x-panel-bbar')
            .contains('Request publication', { matchCase: false })
            .should('be.visible')
            .click()
        home.goTo({ username: HomePage.EDITOR_NAME_AND_PASSWORD, password: HomePage.EDITOR_NAME_AND_PASSWORD })
    }
}

export const home = new HomePage()
