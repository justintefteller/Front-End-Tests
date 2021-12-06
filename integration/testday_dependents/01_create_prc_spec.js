import Part from "../../utils/part";

describe('create_prc', function() {
    beforeEach(function(){
        // login before each test
        cy.login()
    });

    var part = new Part();

    it('Create PRCs', function() {
        var prcs = ['CMP','SER','TLA'];
        cy.wrap(prcs ).each((prc) => {

            part.create_prc( prc );

        });
    });
});
