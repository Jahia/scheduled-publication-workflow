import { BasePage } from './base.page'

class HomePage extends BasePage {
    goTo(user?: authMethod) {
        cy.goTo('/sites/digitall/home.html', user)
        return this
    }
}

export const home = new HomePage()
