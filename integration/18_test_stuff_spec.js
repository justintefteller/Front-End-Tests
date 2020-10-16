//This takes like 5 minutes to run probably best saved for testing day only
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
                    cy.visit(map[key]);
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
                cy.spy(map, visit_links(map))
                visit_links(map)
            });
        });
    });


