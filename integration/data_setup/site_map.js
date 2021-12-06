describe('Site Map', function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });
    it('Checks all links in the site map page', function() {
        const map = {};
        function visit_links(map){
            for(let key in map){
                Cypress.on('uncaught:exception', (err, runnable) => {
                    return false
                });
                if (map[key] != "/admin/schema_diagram"){
                    cy.visit(map[key]);
                } else {
                    cy.log("Don't know how to test this one.")
                }

                if(map[key] != "/firstlogin"){
                    cy.get('#main_nav').should('have.length', 1)
                    cy.get('.error-text').should('not.be','visible')
                    cy.log(`${key} is good`);
                }else{
                    cy.get('.title').should('contain', 'started')
                }
            }
        }
        cy.visit('/admin/site_map')
        cy.get('a.subnav_link2').each((link) => {
            let text = link.text().replace(/\r?\n|\r/g, "");
            let space1  = text.replace(/^\s*/,"")
            let key  = space1.replace(/\s*$/,"")
            map[key] = link.attr('href');
        }).then(() => {
            visit_links(map)
        });
    });
});
