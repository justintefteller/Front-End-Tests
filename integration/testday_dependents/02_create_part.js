import Part from '../../utils/part';

describe('Create Part', function() {
    beforeEach(function(){
        // login before each test
        cy.login()
    })

    var part = new Part();

    it('Creates A Part', function() {
        cy.visit('/part/list')

        var parts = ['CMP1','CMP2','CMP3','CMP4','CMPSerial1'];
        cy.wrap(parts).each((prcpart) => {
            part.create_prcpart( prcpart )
        })
    })


    it('Creates A Non Inventory Part', function() {

        var parts = ['SER1'];
        cy.wrap(parts).each((prcpart) => {
            var prc     = prcpart.substring(0,3);
            var partnum    = prcpart.substring(3);
            cy.visit('/part/list')

            cy.get('table > tbody > tr > td > .part_search').click()
     
                .get('table > tbody > tr > td > .part_search').clear().type( prcpart )
     
                .get('table:nth-child(1) > tbody > tr > td:nth-child(2) > select').select('all')
     
                .get('table > tbody > tr > th > .button2').click()
     

            cy.get('#parts_grid-partlist').then(($a) => {

                if ($a.text().includes( prcpart )) {

                    part.goto_prcpart_edit( prcpart  )

                } else {

                    cy.get('#create_button').click()
             
                        .get('table > tbody > tr > td > #prc').select( prc )
                 
                        .get('table > tbody > tr > td > #part').type( partnum )
                 
                        .get('table > tbody > tr > #desc_col > .textfield').clear().type('test part ' + prcpart )
                 
                        .get('table > tbody > tr > td > #create_part').click()

                }

                cy.get('input[name="non_inventory"]').check('1');

                cy.get('[data-cy=update_profile]').click()

            })

        })
    })

    it('Creates Some BOMs', function() {

        var boms          = ['BOM1','BOM2','BOMSERIAL1','TLA1'];
        var comp_hash     = {};
        comp_hash['BOM1'] = [ 'CMP1', 'CMP2' ];
        comp_hash['BOM2'] = [ 'CMP3', 'CMP4' ];
        comp_hash['BOMSERIAL1'] = ['CMPSERIAL1'];
        comp_hash['TLA1'] = ['BOM1','BOM2','SER1'];
        var rev_hash      = {};
        rev_hash['BOM1']  = [1]
        rev_hash['BOM2']  = [1]
        rev_hash['BOMSERIAL1'] = [1]
        rev_hash['TLA1']  = ['1','2','3bad'];

        cy.wrap(boms).each((prcpart, idx) => {
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


                // add revs to boms
                var revs   = rev_hash[prcpart]
                cy.get('body').then(($a) => {
                    if ( $a.text().includes( 'Back To Revisions' )) {
                        cy.get('body').find('a').contains( 'Back To Revisions' ).click()
                    }
                    cy.wrap(revs).each(( revision ) => {
                        cy.get('input[name="new_revision"]').click();
                        cy.get('input[name="new_revision"]').type( revision );
                        cy.get('.page_content > .main_column > .generic-header > form > .button2').click()
                    });
                    // delete it
                    cy.get('table.web_grid').then(($a) => {
                        if ( $a.text().includes( '3bad' )) {
                            cy.contains('tr', '3bad' ).find('a').contains('Delete').click();
                           //cy.contains('tr', '3bad' ).parent('td').parent('tr').contains('a','Delete').click();
                        }
                    })

                    cy.get('table.web_grid').then(($a) => {
                        if ( $a.text().includes( 'Active' )) {
                            cy.contains('tr', revs[0] ).find('a').contains('Edit BOM').click();
                        }
                    })
                })
                if(idx == 0){
                    cy.get('.kinda_show_grid_control').click()
                    cy.get('#web_grid_control_bom_edit_table').within($control => {
                        cy.get("input[type='radio']").each((box, i) => {
                            if(i == 0 || i % 2 == 0){
                                cy.get(box).click()
                            }
                        });
                    });               
                    cy.get('#cboxClose').click()
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


    it('More BOMs', function() {

        var prcpart  = 'TLA1'; 
        var prc     = prcpart.substring(0,3);
        var part    = prcpart.substring(3);

        cy.visit('/otd/part/bom_search')

        cy.server()
        cy.route("POST", "**/add_map_operation**").as("add_map_operation");
        cy.route("POST", "**/update_map_operation**").as("update_map_operation");
        cy.route("POST", "**/build_operations**").as("build_operations");
        cy.route("GET", "**/build_operations**").as("build_operations_get");
        cy.route("DELETE", "**/delete_all_locations**").as("delete_operations");


        cy.get('table > tbody > tr > td > input.part_search').clear().type( prcpart )
        cy.get('table > tbody > tr > td > .button2').click()
 
        cy.get('table#web_grid-otdpartbomsearch > tbody > tr ').contains(prcpart).then(($a) => {
            Cypress.on('uncaught:exception', (err, runnable) => {
                // have to do this to add labor properly for some reason
                return false
            });

            if ($a.text().includes( prcpart )) {

                cy.get('#web_grid-otdpartbomsearch > tbody > tr > .Revs > a').click()

                // revision 2...
                cy.get('table.web_grid> tbody > tr > td.rev_name ').contains( '2' ).closest('tr').find('a').contains('Labor Plan').click().then( function () {

                    cy.get('#remove_all_locations_button').click();
                    cy.wait("@delete_operations")

                    cy.get('button[name="add_all_locations_button"]').click();

                    cy.get('.remove_location').its('length').should('be.gte', 10).then( function () {

                        var loc_id = Cypress.$( "table > tbody > tr > td:contains('Machine #1')" ).parents('tr:first').find('a.show_table').attr('location_id');
                        cy.get('table > tbody > tr > td ').contains( 'Machine #1' ).closest('tr').find('a.show_table').click()

                        cy.get('select#new_operation_' + loc_id ).select( 'Generic 1 Sec Operation' )
                        cy.get('button#add_map_operation_' + loc_id ).click();
                        cy.wait("@add_map_operation").its("status").should("be.eq", 200)


                        // this isn't quite working - need to chase but want the functions in place for other people.
                        //cy.wait("@add_map_operation").its("status").should("eq",200)
                        cy.wait("@build_operations_get").its("status").should("be.eq",200)

                        cy.get('select#new_operation_' + loc_id ).select( 'Generic 1 Sec Operation' )
                        cy.get('button#add_map_operation_' + loc_id ).click();
                        cy.wait("@add_map_operation").its("status").should("be.eq", 200)
                        //cy.wait(5000)
                        //cy.wait("@add_map_operation").its("status").should("eq",200)
                        cy.wait("@build_operations_get").its("status").should("be.eq",200)
                        cy.wait(150)
                        var itm =""
                        cy.get('table > tbody > tr > td ').contains( 'Machine #1' ).closest("tr").then( tr => {
                            itm = Cypress.$(tr).attr("location_id")
                        }).then( () => {
                            var i =0;
                            cy.get('tr.toplevel_' + itm).each((tr2) => {
                                if ( Cypress.$(tr2).attr("id")) {
                                    var idstr = Cypress.$(tr2).attr("id");
                                    if (idstr.includes("row_")) {
                                        idstr = idstr.substring( 4, idstr.length)
                                        if (i == 0) {
                                            cy.get("#repetitions_" + idstr).clear().type(3240)
                                        } else {
                                            cy.get("#repetitions_" + idstr).clear().type(60)
                                        }
                                        cy.get("#update_map_operation_" + idstr).click()
                                        cy.wait("@update_map_operation")
                                        i++;
                                    }
                                }
                            })
                        })
                    });

                });

            }

        });
    })

    it("Tests Setting 'Force Labor'", function() {

        cy.visit('/otd/part/bom_search?reloaded=1&part_search=BOM1')
        cy.get('table#web_grid-otdpartbomsearch > tbody > tr ').contains('BOM1').then(($a) => {
            if ($a.text().includes( 'BOM1' )) {
                cy.get('#web_grid-otdpartbomsearch > tbody > tr > .Revs > a').click()
                cy.get('table.web_grid> tbody > tr > td.rev_name ').contains( '(unnamed)' ).closest('tr').find('a').contains('Labor Plan').click().then( function () {
                    cy.get('#use_force_labor').select('Use Total Labor Estimate')
                    cy.get('#total_estimated_labor').clear().type( '60' )
                    cy.get('#force_labor_button').click();
                    cy.wait(100)
                    cy.get("#location_table > thead > tr > td").contains("labor plan ignored")
                })
            }
        });


        cy.visit('/otd/part/bom_search?reloaded=1&part_search=BOM2')
        cy.get('table#web_grid-otdpartbomsearch > tbody > tr ').contains('BOM2').then(($a) => {
            if ($a.text().includes( 'BOM2' )) {
                cy.get('#web_grid-otdpartbomsearch > tbody > tr > .Revs > a').click()
                cy.get('table.web_grid> tbody > tr > td.rev_name ').contains( '(unnamed)' ).closest('tr').find('a').contains('Labor Plan').click().then( function () {
                    cy.get('#use_force_labor').select('Use Total Labor Estimate')
                    cy.get('#total_estimated_labor').clear().type( '60' )
                    cy.get('#force_labor_button').click();
                    cy.wait(100)
                    cy.get("#location_table > thead > tr > td").contains("labor plan ignored")
                })
            }
        });

    })

    it('Tests Infinite Recursion Checks', function() {

        // block recursive boms
        cy.visit('/otd/part/bom_search?reloaded=1&part_search=BOM1')
        cy.get('table#web_grid-otdpartbomsearch > tbody > tr ').contains('BOM1').then(($a) => {
            if ($a.text().includes( 'BOM1' )) {
                cy.get('#web_grid-otdpartbomsearch > tbody > tr > .Edit > a').click()

                cy.get('input[name="new_component_1"]').clear().type( 'TLA1' );
                cy.get('input[name="new_qty_per_top_1"]').clear().type( 1 );
                cy.get('#bom_edit_table > tbody > .table_show_hide_touched > td > .submit_form').click()

                cy.get(".status_message_container").should('be.visible')
            }
        })

    })

    it('Sets Last Resort Cost', function () {

        cy.visit('/')

        part.goto_prcpart_edit( 'CMP1' )
        cy.get('input[name="last_resort_cost"]').clear().type('.50');
        cy.get('[data-cy=update_profile]').click();

        part.receive_stock_without_po( 'CMP1' );

        part.goto_prcpart( 'CMP1' )
        cy.get('#default_cost').contains('$1.00');
        cy.get('.avg_cost').contains('$1.00'); 
        // this will fail if any pquotes have been created...

    })

})

