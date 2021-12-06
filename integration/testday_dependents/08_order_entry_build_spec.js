import Navigation from '../../utils/navigation';
import Assertion from '../../utils/assertions';
import Part from '../../utils/part';
import Quote from '../../utils/quotes';

describe("The Order Entry Build", function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });
    const nav   = new Navigation(),
        assert  = new Assertion(),
        part    = new Part(),
        quote   = new Quote(),
        moment  = require("moment"),
        today2  = moment().format("YYYY-MM-DD");

    it("Receives enough parts to make sure it doesnt run out", function () {
        part.receives_stock_from_api(["CMP1", "CMP2", "BOM1"], 100)
    });

    it("Creates a New Quote", function () {
        quote.new_order([{prcpart: 'BOM1', transcode: 'SA' }]);
        cy.get(".table_show_hide_touched").contains("Build");
    });

    it("Creates An Outsouce PO", function () {
        nav.side_menu("Workorder")
        nav.side_menu("Line 1")
        nav.side_menu("Outsource")
        cy.get("#vendor_search").type("Stuff And");
        nav.get_dropdown("Stuff And More")
        cy.get("#prcpart").type("BOM1");
        cy.get("#comments").type("test part BOM1");
        cy.get("#link_qty_to_ordline_id").click();
        cy.get("#qty").should("be.disabled");
        cy.get("#qty").parent().should("contain", "Lock Qty To Line (10)");
        cy.get("#create_outsource_po").click();
        cy.get(".status_message").should("contain", "Success").then(function($text) {
            //this should always get the po number from the alert 
            cy.wrap(Cypress.$($text).text().match(/MN\d*(.*)\d*/)[0].replace(/MN/g, "").replace(/ Created!/g, "")).as("po_num");
        }).then(function(){
            const po_num = this.po_num;
            cy.get(".header").then($text => {
                //this should always get the order number from the header
                let order_num   = Cypress.$($text).text().match(/(\d+(.*)\d*) Line: \d*/)[0].replace(/  Line: /, '-');
                const outsource_po = [ 
                    po_num,"1","Stuff And More","BOM1",today2,`(qty is locked to ${order_num}`, 
                    "$0.00","$0.00","Open","test part BOM1","Packing Slip"
                ];
                cy.get(".web_grid > tbody > tr > td").each(function (td, idx) {
                    cy.get(td).contains(outsource_po[idx]);
                });
            })
        });
    });

    it("Picks Parts", function () {
        cy.on("window:confirm", cy.stub());
        nav.side_menu("Pick Parts")
        cy.get("body").find("a").contains("Pick All Line").click();
        cy.get(".submit_button").contains("Update").click();
        nav.side_menu("Workorder")
        cy.get("#show_time_popup").click();
        cy.get("#add_work_form > .regular_time_entry").within($start_work => {
            cy
                .wrap($start_work)
                .find('input[type="submit"]')
                .contains("Start Work")
                .click();
        });
    	cy.wait(3000);
        cy.get("#user_work_info").within($stop_work => {
            //for the start and stop work function
            cy.wait(10000);
            cy.wrap($stop_work).find("button").contains("Stop Work").click();
        });
        cy.get("#chart").should("be.visible");
    });

    it("Invoices the WO", function () {
        nav.side_menu("Invoice");
        cy.get('input[type="number"]').focus().type(10);
        cy.get(".use_est_labor").click();
        cy.get(".fill_labor").click();
        cy.get("body").find("button").contains("Create Invoice").click();
        cy.on("window:confirm", cy.stub());
        cy.get("tfoot").within($tr => {
            $tr = "tr";
            cy.get($tr).last().within($th => {
                cy.wrap($th).should("contain", "$1,000.00");
            });
        });
    });

    it("Uninvoices the Invoice", function () {
        const amounts           = ["$-1,000.00","$-255.00","$255.00","$1,000.00","$10.00","$50.00","$-10.00","$-50.00",],
            uninvoice_amounts   = ["$-1,000.00","$-255.00","$255.00","$1,000.00","$-1,000.00","$-255.00","$255.00","$1,000.00", ];        
        cy.window().then($win => {
            var invoice_url = $win.location.pathname;
            var invoice_id = $win.location.pathname.match(/\d*/g);
            cy.wrap(invoice_id[9]).as('invoice_id');
            cy.wrap(invoice_url).as('invoice_url');
        }).then(() => {
            assert.check_global_ledger(this.invoice_id, 'Invoice', amounts, 8)
            cy.visit(this.invoice_url)
            nav.side_menu("Uninvoice");
            cy.on("window:confirm", cy.stub());
            assert.success('Invoice Cancelled')
            assert.check_global_ledger(this.invoice_id, 'Invoice', uninvoice_amounts, 16)
        })
    });
});
