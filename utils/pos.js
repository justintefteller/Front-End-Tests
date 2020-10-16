import Navigation from "../utils/navigation"
var nav = new Navigation();

class PO {
    create_purchaseorder = (lines, taxes, freight) => {
        cy.visit("/pquote/list");
        cy.server();
        cy.route(
            "GET",
            "/pquote/search?pquote=*&location=**&prcpart=**&qty=*&compid=new&commit_date=**&vendid=*&uom=*"
        ).as("pageLoad");
        cy.route("POST", "/pquote/*/ajax_create_line").as("addLine");
    
        cy.get("#create_pquote").click();
        cy.get(".edit-header-button").click();
        cy.get("#vendor_search").type("House Of");
        cy.get(".ui-menu-item-wrapper", { timeout: 10000 }).then(($this) => {
            cy.get($this).contains("House Of").click();
        });
    
        if (taxes) {
            cy.get("#moreBtn").click();
            cy.get('input[name="taxable"]').first().check();
            cy.get("#tax_search").focus().type("10");
            cy.wait(2000);
            cy.get(".ui-menu-item-wrapper", {
                timeout: 10000,
            })
                .contains("Percent")
                .click();
        }
        if (freight) {
            cy.get("#freight_estimate").type(freight);
        }
    
        cy.get('input[name="update_header"]').click();
        lines.forEach((line, i) => {
            if (!line.prcpart) line.prcpart = "CMP1";
            if (!line.qty) line.qty = "10";
            cy.get("#custpart_new").clear().type(line.prcpart);
            cy.get("#qty_new").clear().type(line.qty).blur();
            cy.wait("@pageLoad");
            cy.get("#add_newline").click();
            cy.wait("@addLine");
        });
        nav.side_menu("Convert to PO");
        cy.get("#button").click();
    };
}

export default PO;
