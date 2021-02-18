import { BasePage } from './base.page'

class HomePage extends BasePage {
    goTo(user?: authMethod) {
        cy.goTo('/sites/digitall/home.html', user)
        cy.goTo('/cms/edit/default/en/sites/digitall/home.html?redirect=false', user)
        return cy
    }
}

export const home = new HomePage()
