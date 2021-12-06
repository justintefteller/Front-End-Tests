import PO from "../../utils/pos"

describe("PO Tab", function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });

    var po = new PO();

    it("Creates PO", function () {
        var lines = [
            { prcpart: "CMP1", qty: 100 },
            { prcpart: "SER2", qty: 100 },
            { prcpart: "CMPSERIAL1", qty: 100 },
            { prcpart: "CMP1", qty: 100 }
        ];
        po.create_purchaseorder(lines);
    });

    it("Makes Changes To The Same PO", function () {
        cy.location().then(function(loc) {
            cy.wrap(loc.pathname).as('tab').then(() => { 
                cy
                    .get("#po-lines > tbody > tr")
                    .find("a")
                    .contains("Receive")
                    .invoke("attr", "href")
                    .then($urlstring => {
                        cy.visit($urlstring);
                    });
                cy.get("#receive_and_clear", {timeout: 10000}).click({timeout: 10000});
                cy.get(".entry_success").should("be.visible");

                //Receives the first 50 from the first line

                cy.wait(1000);
                cy.get("#quantity").clear().type(50);

                //Accepts 25

                cy.get("#qty_accepted").type(25);

                //Rejects 25

                cy.get("#qty_rejected").type(25);
                cy.wait(1000);
                cy.get("#receive_and_clear").click();
                cy.get(".entry_success").should("be.visible");
                cy.visit(this.tab);

                //Goes to the next line of the PO and receives the line

                cy
                    .get("#po-lines > tbody > tr")
                    .find("a")
                    .contains("Receive")
                    .invoke("attr", "href")
                    .then($urlstring => {
                        cy.visit($urlstring);
                    });
                cy.wait(1000);
                cy.get("#qty_accepted").type(100);
                cy.get("#receive_and_clear").click();
                cy.get(".entry_success").should("be.visible");
                cy.visit(this.tab);

                //Goes to the last line

                cy
                    .get("#po-lines > tbody > tr")
                    .find("a")
                    .contains("Receive")
                    .invoke("attr", "href")
                    .then($urlstring => {
                        cy.visit($urlstring);
                    });

                //Adds Serials

                cy.get(".button.piece_detail").contains("+ Pieces/Serials").click();
                cy.wait(1000);
                cy.get("#num_pieces_2").type(4);
                cy.get("#per_piece_size_2").type(25);
                cy
                    .get("#piece_detail_table")
                    .find("input[type=checkbox]")
                    .then($checkbox => {
                        cy.wrap($checkbox).click();
                    });
                cy.get("#receive_and_clear").click();
                cy.get(".entry_success").should("be.visible");

                //Revisits the closed PO

                cy.visit(this.tab);
                cy.wait(1000);

                //Acknowledges

                cy.get(".vertical_nav_notab").contains("Acknowledge").click();
                cy.get("select[name='po_ack']").select("Yes");
                cy.get("textarea[name='po_ack_comments']").type("Acknowledged");
                cy.get("input[type='submit']").click();
                cy
                    .get(
                        "body > div.body-wrapper > div.site-wrapper > div > div > div.body_vertical_nav.clearfix > div > form > table > tbody"
                    )
                    .contains("Updated on")
                    .should("be.visible");
                cy.get(".vertical_nav_notab").contains("View").click();

                // Goes to the first line receipt of the PO

                var numberPattern = /^[0-9]/g;
                cy
                    .get(".table_show_hide_touched")
                    .find("a")
                    .contains(numberPattern)
                    .invoke("attr", "href")
                    .then($urlstring => {
                        cy.visit($urlstring);
                    });

                //Cancels receipt

                cy.get(".vertical_nav_notab").contains("Cancel Receipt").click();
                cy.wait(1000);

                //Adds Note

                cy.get(".vertical_nav_notab").contains("Notes").click();
                cy.get(".add_note_button").click();
                cy.get("#note_add_comment").type("A note a day keeps the doctor away");
                cy.get("#note_add_submit").click();
                cy
                    .get("#sticky-note")
                    .contains("A note a day keeps the doctor away")
                    .should("be.visible");
                cy.get(".vertical_nav_notab").contains("View").click();
                cy.wait(1000);

                //Deletes the first line of the PO

                cy.get(".vertical_nav_notab").contains("Delete Line/All").click();
                cy.get("input[type=checkbox]").last().then($checkbox => {
                    cy.wrap($checkbox).click();

                    //Clicks through the alert

                    var stub = cy.stub();
                    cy.on("window:alert", stub);
                    cy.get("#delete_lines").click();
                });
                cy.get(".button2").last().click();

                //Checks to see if the line is deleted

                cy.visit(this.tab);
                cy.get("[data-cy=po_lines]").should('have.length', 2);
            });
        });
    });
});
