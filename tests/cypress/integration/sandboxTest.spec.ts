import { sandboxPage } from '../page-object/sandbox.page'

describe('Successfully navigates to sandbox app', () => {
    it('successfully goes to token app through dashboard menu and finds create token button', function () {
        sandboxPage.goTo()
        expect(sandboxPage.getByText('button', 'Some Action')).not.to.be.undefined
    })
})
