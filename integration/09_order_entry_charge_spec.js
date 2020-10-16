import General from '../utils/general';

describe("The Order Entry Charge Tab", function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });
    var gen = new General();
    var [today, futureDate] = gen.dates()

    it("Set Go Live Config", function(){
        //for an invoice error
        cy.request({
            method: "PATCH",
            url: "/api/config/golive_date_ymd",
            dataType: "json",
            body: {
                value: today,
            },
        });
    });

    it("Creates a New Quote", function () {
        cy.server();
        cy.route("GET", "/inv/search*").as("invSearch");
        cy.route("GET", "/quote/*/get_totals").as("getTotal");
        cy.route("GET", "/quote/*/get_ecos_for_quote").as("ecos");
        cy.visit("/quote/list");
        cy.get(".button").contains("Create").then($button => {
            cy.wrap($button).click();
        });
        cy.get(".edit-header-button").click();
        cy.get("#customer_search").focus().type(" ");
        cy
            .get(".ui-menu-item", {
                timeout: 10000
            })
            .contains("ABC Inc.")
            .click();
        cy.get("#custponum").type(gen.info(7));
        cy.get("#shipto_update_container").should("be.visible");
        cy.get("#update_header_button").click();
        cy.get("#quick_prcpart").type("SER1");
        cy.get("#qty_1").clear().type(1);
        cy.wait("@invSearch").its("status").should("be", 200);
        cy.get(".kinda_show_grid_control").click().wait(1000);

        cy
            .get("#web_grid_control_quote-lines > tbody")
            .find("tr")
            .contains("Resale")
            .siblings()
            .then($radio => {
                var radio = "input[type='radio']";
                cy.wrap($radio).find(radio).first().click();
            });
        cy.get("#cboxClose").click();
        cy.get("#resale_1").clear().type(100);
        cy.get("#add_newline").click();
        cy.wait("@getTotal").its("status").should("be", 200);
        cy.get(".edit-row-buttons-container > .edit-line-button").first().click();
        cy.get("#transcode-1").select("NN");
        cy.get(".edit-line-submit").contains("OK").first().click();
        cy.get(".vertical_nav_notab").find("a").contains("Commit").click();
        cy.get("#place-order-button").click();
        cy.get(".status_message").contains("Created Order");
        cy.get(".table_show_hide_touched").contains("Charge");
    });
    it("Invoices the order", function () {
        cy.get(".vertical_nav_notab").find("a").contains("Invoice").click();
        cy.get("body").find("button").contains("Create Invoice").click();
        cy.on("window:confirm", cy.stub());
        // cy.get(".status_message").contains("Success");
        cy.get("tfoot").within($tr => {
            $tr = "tr";
            cy.get($tr).last().within($th => {
                cy.wrap($th).should("contain", "$100.00");
            });
        });
    });

    it("Sells Again", function () {
        // cy.get('.web_grid').find('a').contains('-1').click()
        cy.get(".vertical_nav_notab").find("a").contains("Sell Again").click();
        cy.get(".status_message").contains("Success");
        cy.get("#edit-header-show").click();
        cy.get("#custponum").type(gen.info(7));
        cy.get("#update_header_button").click();
        cy.get(".vertical_nav_notab").find("a").contains("Commit ").click();
        cy.get("#place-order-button").click();
        cy.get(".table_show_hide_touched > td").then($td => {
            //some hidden columns that make you do it this way plus we can't guarentee what the cost will be
            cy.wrap($td).eq(0).should("contain", "1");
            cy.wrap($td).eq(1).should("contain", "1");
            cy.wrap($td).eq(2).should("contain", "Charge");
            cy.wrap($td).eq(3).should("contain", "SER1");
            cy.wrap($td).eq(6).should("contain", "$100.00");
            cy.wrap($td).eq(8).should("contain", today);
            cy.wrap($td).eq(9).should("contain", today); 
            // if you use *7* it's work start date which is only accurate when running tests on a business day
            cy.wrap($td).eq(14).should("contain", "$100.00");
        });
    });

    it("Creates a Bill Only Invoice", function () {
        cy.visit("invoice/list");
        cy.get("#show_create_invoice").click();
        cy.get("#find_customer:visible").focus().type("ABC Inc.");
        cy.get(".ui-menu-item", { timeout: 10000 }).contains("ABC Inc.").click();
        cy.get(".button2").contains("Create").click();
        cy.get("#termscode").select("1");
        cy.get("#shipvia").select("1");
        cy.get('input[name="taxtype"]').eq(1).click();
        cy.get("#tax_group_id").select("5");
        cy.get('input[name="add_line"]').clear().type(5);
        cy.get(".button2").contains("Update").click();
        cy.get("#order-lines > tbody").then($tbody => {
            cy.get($tbody).its("length").should("be.eq", 13);
        });
        Cypress.on("uncaught:exception", (err, runnable) => {
            return false;
        });
        cy.add_bill_to_lines(7, 1);
        cy.get(".button2").contains("Update").click();
        cy.get(".vertical_nav_notab").find("a").contains("View").click();
        cy
            .get("tfoot > .table_show_hide_touched")
            .last()
            .should("contain", "$100.10");
    });
});
