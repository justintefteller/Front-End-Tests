import General from '../utils/general';
import Navigation from '../utils/navigation';
import Part from '../utils/part';

describe("The Order Entry Charge Tab", function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });
    var gen = new General();
    var part = new Part();
    var nav = new Navigation();
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
        part.check_initial_data_exists();
        cy.server();
        cy.route("GET", "/inv/search*").as("invSearch");
        // cy.route("GET", "/quote/*/get_totals").as("getTotal");
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
        cy.wait("@invSearch").its("status").should("be.eq", 200);
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
        cy.wait(5000)
        // cy.wait("@getTotal").its("status").should("be.eq", 200);
        cy.get(".edit-row-buttons-container > .edit-line-button").first().click();
        cy.get("#transcode-1").select("NN");
        cy.get(".edit-line-submit").contains("OK").first().click();
        nav.side_menu("Commit")
        cy.get("#place-order-button").click();
        cy.get(".status_message").contains("Created Order");
        cy.get(".table_show_hide_touched").contains("Charge");
    });
    it("Invoices the order", function () {
        nav.side_menu("Invoice")
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
        nav.side_menu("Sell Again");
        cy.get(".status_message").contains("Success");
        cy.get("#edit-header-show").click();
        cy.get("#custponum").type(gen.info(7));
        cy.get("#update_header_button").click();
        nav.side_menu("Commit ");
        cy.get("#place-order-button").click();
        const zero = "$0.00";
        const hundo = "$100.00";
        const order_line_values = {
            ".lineitem": '1',
            ".balance_due": '1',
            ".transcode": 'Charge',
            ".prcpart": 'SER1',
            ".part_description": 'test part SER1',
            ".revision": "(unnamed)",
            ".cost": zero,
            ".resale": hundo,
            ".target_wip_date": today,
            ".promisedate": today,
            ".ext_cost": zero, 
            ".ext_resale": hundo,
            ".line_tax": zero,
        };
        const totals = {
            ".tax_amount": zero,
            ".freight_cost": zero,
            ".freight_resale": zero,
            ".total_resale": hundo,
            ".total_cost": zero,
        };
        cy.get("#open-order-lines").within(() => {
            cy.wrap(Object.keys(order_line_values)).each((cls) => {
                cy.get(cls).should('contain', order_line_values[cls]);
            });
        });
        cy.get("tfoot").within(() => {
            cy.wrap(Object.keys(totals)).each((cls) => {
                cy.get(cls).should('contain', totals[cls]);
            });
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
        nav.side_menu("View");
        cy
            .get("tfoot > .table_show_hide_touched")
            .last()
            .should("contain", "$100.10");
    });
});
