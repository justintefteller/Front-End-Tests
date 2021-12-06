import Part from '../utils/part';

describe('Create Part', function() {
    beforeEach(function(){
        // login before each test
        cy.login()
    })

    var part = new Part();

    it('Creates A Part', function() {
        cy.visit('/part/list')

        var parts = [ 'PRT1234'];
        cy.wrap(parts).each((prcpart) => {
            part.create_prcpart( prcpart )
        })
    })


    it('Creates Some BOMs', function() {

        var boms          = ['BOM1','BOM2','BOM3','BOM4'];
        var comp_hash     = {};
        comp_hash['BOM1'] = [ 'BOM2' ];
        comp_hash['BOM2'] = [ 'BOM3' ];
        comp_hash['BOM3'] = ['BOM4'];
        comp_hash['BOM4'] = ['PRT1234'];

        cy.wrap(boms).each((prcpart) => {
            var prc     = prcpart.substring(0,3);
            var partnum    = prcpart.substring(3);
            cy.visit('/part/list')

            cy.get('table > tbody > tr > td > .part_search').click()
     
                .get('table > tbody > tr > td > .part_search').clear().type( prcpart )
     
                .get('table:nth-child(1) > tbody > tr > td:nth-child(2) > select').select('all')
     
                .get('table > tbody > tr > th > .button2').click()
     
            cy.get('table#parts_grid-partlist > tbody ').then(($a) => {

                if ($a.text().includes( prcpart )) {

                    cy.get('table#parts_grid-partlist > tbody').find('a').contains( partnum ).invoke('attr', "href").then( $urlstring => {
                        cy.get('table#parts_grid-partlist > tbody').find('a').contains( partnum ).click()

                        var url     = $urlstring.replace("inventory", 'edit_bom');
                        cy.visit( url );

                    })

                } else {

                    cy.get('#create_button').click()
             
                    cy.get('table > tbody > tr > td > #prc').select( prc )
             
                    cy.get('table > tbody > tr > td > #part').clear().type( partnum )
             
                    cy.get('table > tbody > tr > #desc_col > .textfield').click()
             
                    cy.get('table > tbody > tr > #desc_col > .textfield').clear().type('test part ' + prcpart )

                    cy.get('#create_as_bom').check('1') 
             
                    cy.get('#create_part').click()

                }
                
                // add components to boms
                var comps   = comp_hash[prcpart];
                cy.wrap(comps).each((component) => {

                    Cypress.on('uncaught:exception', (err, runnable) => {
                        // have to do this to add labor properly for some reason
                        return false
                    });
                    var count = 0;
                    cy.get('#bom_edit_table > tbody').then(($a) => {

                        count = count + 1;
                        var qty = 1;
                        if (component.includes('CMP')) {
                            qty = 10;
                        }

                        if (! $a.text().includes( component )) {

                            cy.get('input[name="new_compnum_1"]').clear().type( count );
                            cy.get('input[name="new_component_1"]').clear().type( component  );
                            cy.get('input[name="new_qty_per_top_1"]').clear().type( qty );
                            cy.get('#bom_edit_table > tbody > .table_show_hide_touched > td > .submit_form').click()

                        }

                    })

                })

            })

        })

    })

})

