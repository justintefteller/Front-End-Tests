import 'cypress-iframe'
import Navigation from '../utils/navigation';
describe('', function () {
    const nav = new Navigation();

    beforeEach( function(){
        cy.login();
        cy.viewport(1200, 700);
    });
    it('checks iframe shit',function() {
        cy.visit('/quote/2/view')
        nav.side_menu('Commission')
        cy.iframe().find('.header').should('contain', '2')
        cy.enter('.cboxIframe').then(getBody => {
            getBody().find('input[name="add_vendor_name"]').type('House Of Stuff')
            getBody().find(".ui-menu-item-wrapper", {timeout: 10000,}).contains(`House Of Stuff`).click();
            getBody().find('#commission_notes').type('this is cool')
            getBody().find('.button2').click()
          })
    });
});