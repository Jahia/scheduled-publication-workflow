import {workflowPage} from '../page-object/workflow.page';
import * as dayjs from 'dayjs';
import {getRootClient} from '../support/gql';
import {ApolloClient, NormalizedCacheObject} from 'apollo-client-preset';

const checkContentPublished = require(`graphql-tag/loader!../fixtures/checkIfContentIsPublished.graphql`);
let publicationTime;

function checkPublishedPropertyFromContent(client: ApolloClient<NormalizedCacheObject>) {
    return client.query({
        query: checkContentPublished,
        variables: {
            path: `/sites/digitall/home/area-main/area/area/area/area-main/test-content-one`,
        },
        errorPolicy: 'all',
        fetchPolicy: 'no-cache',
    });
}

function checkForPublishedEmailRecursively() {

    cy.request({
        url: `${Cypress.env('MAILHOG_URL')}/api/v2/search`, qs: {kind: 'to', query: 'jahia.editor@test.com'}
    })
        .then((resp) => {
            if (dayjs() > publicationTime) {
                throw new Error('Something wrong with the test, email did not arrive for the publication');
            }
            if (resp.status === 200 && resp.body.total === 1) {
                expect(resp.status).to.eq(200);
                expect(resp.body.total).to.eq(1);
                expect(resp.body.items[0].Content.Headers.Subject[0]).to.eq('Content has been published on Digitall');
                expect(resp.body.items[0].Content.Body).to.contain(publicationTime.format('MMM DD, YYYY'));
                return;
            }
            checkForPublishedEmailRecursively();
        });
}


describe('Editor in chief reschedule test', () => {
    before(async function () {
        publicationTime = dayjs().add(1, 'minute');
        await workflowPage.requestPublicationAndValidateContent(publicationTime.format('DD.MM.YYYY HH:mm'));
    });

    it(
        'Checks that content is not published after validation',
        async function () {
            workflowPage.cleanUpEmails();
            const client = getRootClient();
            const getContentStatus = await checkPublishedPropertyFromContent(client);
            expect(getContentStatus.errors).to.be.undefined;
            expect(getContentStatus.data.jcr.nodeByPath.property).to.be.null;
        },
    );

    it(
        'Checks for email publishing',
        function () {
            checkForPublishedEmailRecursively();
        }
    );

    after(function () {
        workflowPage.logout();
    });
});
