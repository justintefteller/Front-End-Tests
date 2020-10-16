describe('', function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });
    function warn(item){
        console.log(item)
    }
    it('does something', () => {
        cy.visit('order/list')
        cy.get('.button2').then($button2 => {
            cy.spy($button2, cy.wrap($button2).click())
        })
    })
});