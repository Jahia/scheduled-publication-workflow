import { BasePage } from './base.page'

class SandboxPage extends BasePage {
    elements = {
        sandbox: "[data-sel-role*='sandbox']",
    }

    goTo() {
        cy.goTo('/jahia/dashboard')
        cy.get(this.elements.sandbox).click()
        return this
    }
}

export const sandboxPage = new SandboxPage()
