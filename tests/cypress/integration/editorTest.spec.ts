import { home } from '../page-object/home.page'

describe('navigation to user', () => {
    it('navigates to the users page successfully', function () {
        home.goTo({ username: 'editor', password: 'editor' })
    })
})
