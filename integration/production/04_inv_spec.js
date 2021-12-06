import Part from '../../utils/part';
describe("Inv", function () {
    beforeEach(() => {
        cy.login()    
    });
    var part = new Part();
    it('adds part to stock', function() {
        part.check_initial_data_exists();
        var prcparts = ['CMP1','CMP2','CMP3','CMPSerial1'];

        cy.visit("/receiving/add_stock_form")
        cy.wrap(prcparts).each(prcpart => {
            cy.get('table > tbody > tr > td > #prcpart').click()

            cy.get('table > tbody > tr > td > #prcpart').type(prcpart)

            cy.get('table > tbody > tr > td > #quantity').click()

            cy.get('table > tbody > tr > td > #quantity').type('10')

            cy.get('table > tbody > .inspection > td > #receive_and_clear').click()
        });
     });


    it('edits inv data', function () {
        var prcpart = "CMP1";
        cy.visit('/part/list')
        cy.server()
        cy.route("POST", "**/part/update_bin_info**").as("updateBinInfo"); 

        // really, everywhere that has first in here could be inside a "then" after grabbing the first one... (idealism)

        cy.get('table > tbody > tr > td > .part_search').clear().type(prcpart)
          .get('table > tbody > tr > th > .button2').click()
          .get('#parts_grid-partlist > tbody > tr > .Part > a').click()

        cy.get('.web_grid > tbody > tr > .nowrap > .show_bin_edit').first().click()

        cy.get('.web_grid > tbody > tr.bin_details').first().then(option => {
            cy.wrap(option).find('td > input[name*="date_code_"]').click().clear().type(4)
            cy.wrap(option).find('td > input[name*="lot_code_"]').click().clear().type('123456')
            cy.wrap(option).find('td > input[name*="revision_"]').click().clear().type('A')
        })
     
        cy.get('.web_grid > tbody > .bin_details > th > .update_lot_data').first().click()

        cy.reload() // need to force cypress to reload even though above .click() reloads. otherwise below elements dont exist

        // make sure vals set correctly 
        cy.get('.web_grid > tbody > tr > .nowrap > .show_bin_edit').first().click()
        cy.get('.web_grid > tbody > tr.bin_details').first().then(option => {
            cy.wrap(option).find('td > input[name*="lot_code_"]').should('have.value', '123456')
            cy.wrap(option).find('td > input[name*="revision_"]').should('have.value', 'A')
            cy.wrap(option).find('td > input[name*="date_code_"]').should('have.value', '4')
        })


        // increase shelf qty 
        cy.get('.web_grid > tbody > tr > td > input[name*="qty_"]').first().clear().type('15')
          .get('.web_grid > tbody > tr > .nowrap > .reason_select').first().select('Miscount')
          .get('.web_grid > tbody > tr > td > input[name*="reason_text"]').first().clear().type('test increase 454433zyx')
          .get('.web_grid > tbody > tr > td > .update_bin_qty').first().click()

        cy.get('.web_grid > tbody > tr > td > input[name*="qty_"]').first().should('have.value', '15')

        // wait for page load
        cy.wait("@updateBinInfo")

        // decrease shelf qty 
        cy.get('.web_grid > tbody > tr').then(tr => {
          cy.wrap(tr).find(' td > input[name*="qty_"]').first().clear().type('10')
          cy.wrap(tr).find(' td.nowrap > .reason_select').first().select('Miscount')
          cy.wrap(tr).find(' td > input[name*="reason_text"]').first().clear().type('test decrease 454433zyx')
          cy.wrap(tr).find(' td > button.update_bin_qty').first().click()
          cy.wrap(tr).find(' td > input[name*="qty_"]').first().should('have.value', '10')
        }) 
    }); 

    it('checks inventory activity report', function() {
        var prcpart = "CMP1";
        cy.visit('/part/activity_list')
        
        cy.get('tbody > tr > th > .value_container > .part_search').click()
          .clear()
          .type(prcpart)

          .get('table > tbody > tr > td > .button2').click()

        cy.wait(1500)

        cy.get('table > tbody > tr > td ').contains( 'test decrease 454433zyx' ).closest('tr')
          .get('.QtyChange').should('contain', '-5')
          .get('.NewBinQty').should('contain', '10')
          .get('.ReasonText').should('contain', 'test decrease 454433zyx')
        
        cy.get('table > tbody > tr > td ').contains( 'test increase 454433zyx' ).closest('tr')
          .get('.QtyChange').should('contain', '5')
          .get('.NewBinQty').should('contain', '15')
          .get('.ReasonText').should('contain', 'test increase 454433zyx')

    });

    it('removes inventory', function() {
        var prcpart = "CMP1";
        cy.visit('/part/list')

        cy.get('table > tbody > tr > td > .part_search').click()
          .clear()
          .type(prcpart)
          .get('table > tbody > tr > th > .button2').click()
          .get('#parts_grid-partlist > tbody > tr > .Part > a').click()

        cy.get('.web_grid > tbody > tr > td > input[name*="qty_"]').first().click().clear().type('0')

          .get('.web_grid > tbody > tr > .nowrap > .reason_select').first().select('Miscount')

          .get('.web_grid > tbody > tr > td > input[name*="reason_text"]').first().clear().type('delete from inventory')

          .get('.web_grid > tbody > tr > td > .update_bin_qty').first().click()

        // make sure no inventory present
        cy.get('#web_grid').should('not.exist')
    });
}); 
