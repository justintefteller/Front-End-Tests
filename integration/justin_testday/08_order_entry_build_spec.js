import Navigation from '../utils/navigation';
import Assertion from '../utils/assertions';
import General from '../utils/general';
import Part from '../utils/part';

describe("The Order Entry Build", function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });
    var nav = new Navigation();
    var assert = new Assertion();
    var gen = new General();
    var part = new Part();
    var [today, futureDate] = gen.dates()

    //little speed up here
    // it("Receives enough parts to make sure it doesnt run out", function () {
    //     part.receives_stock_from_api(["CMP1", "CMP2", "BOM1"], 100)
    // });

    // it("Creates a New Quote", function () {
    //     cy.server();
    //     cy.route("GET", "/inv/search*").as("invSearch");
    //     cy.route("GET", "/quote/*/get_totals").as("getTotal");
    //     cy.route("GET", "/quote/*/get_ecos_for_quote").as("ecos");
    //     cy.visit("/quote/list");
    //     cy.get(".button").contains("Create").then($button => {
    //         cy.wrap($button).click();
    //     });
    //     cy.get(".edit-header-button").click();
    //     cy.get("#customer_search").focus().type("ABC Inc.");
    //     nav.get_dropdown("ABC Inc.")
    //     cy.get("#custponum").type(gen.info(6))
    //     cy.get("#shipto_update_container").should("be.visible");
    //     cy.get("#update_header_button").click();
    //     cy.get("#quick_prcpart").type("BOM1");
    //     cy.get("#qty_1").clear().type(10);
    //     cy.wait("@invSearch").its("status").should("eq", 200);
    //     cy.get(".kinda_show_grid_control").click().wait(1000);

    //     cy
    //         .get("#web_grid_control_quote-lines > tbody")
    //         .find("tr")
    //         .contains("Resale")
    //         .siblings()
    //         .then($radio => {
    //             var radio = "input[type='radio']";
    //             cy.wrap($radio).find(radio).first().click();
    //         });
    //     cy.get("#cboxClose").click();
    //     cy.get("#resale_1").clear().type(100);
    //     cy.get("#cost_1").wait(1000).clear().type(10);
    //     cy.get("#add_newline").click();
    //     cy.wait("@getTotal").its("status").should("eq", 200);
    //     cy.get(".edit-row-buttons-container > .edit-line-button").first().click();
    //     cy.get("#transcode-1").select("SA");
    //     cy.get(".edit-line-submit").contains("OK").first().click();
    //     cy.get(".vertical_nav_notab").find("a").contains("Commit").click();
    //     //double wammy here, wait then a reload but it works well. 
    //     //the BOM1 worksheet doesn't load before the wait ends but if you reload without a wait or before the wait it will crash
    //     cy.wait("@ecos");
    //     cy.reload();
    //     var alert_string = 'One or more BOM Worksheets are still loading. Please wait, reload this screen, and try again';
    //     assert.exists('.order_alerts_and_extras').then(res => {
    //         if(res == true){
    //             assert.text_exists('.order_alerts_and_extras', alert_string).then((res2) => {
    //                 if(res2 == true){
    //                     cy.reload();
    //                 }
    //             });
    //         }
    //     })
    //     cy.get("#place-order-button").click();
    //     cy.get(".status_message").contains("Created Order");
    //     cy.get(".table_show_hide_touched").contains("Build");
    // });

    // it("Creates An Outsouce PO", function () {
    //     nav.side_menu("Workorder")
    //     nav.side_menu("Line 1")
    //     nav.side_menu("Outsource")
    //     cy.get("#vendor_search").type("Stuff And");
    //     nav.get_dropdown("Stuff And More")
    //     cy.get("#prcpart").type("BOM1");
    //     cy.get("#comments").type("test part BOM1");
    //     cy.get("#link_qty_to_ordline_id").click();
    //     cy.get("#qty").should("be.disabled");
    //     cy.get("#qty").parent().should("contain", "Lock Qty To Line (10)");
    //     cy.get("#create_outsource_po").click();
    //     cy.get(".status_message").should("contain", "Success").then($text => {
    //         //This should always get the po number from the success message 
    //         var regex = /[-+]?([0-9]*.[0-9]+|[0-9]+)/g;
    //         var num = Cypress.$($text).text().match(regex);
    //         var string = num.toString();
    //         var extraLetter = string.replace(/\,/g, "");
    //         var po_num = extraLetter.replace(/[A-Z]+/g, "");
    //         cy.get(".header").then($text => {
    //             //this should always get the order number from the header
    //             var array = [];
    //             var nums = Cypress.$($text).text().match(regex);
    //             for (let i = 0; i < nums.length; i++) {
    //                 if (nums[i] == nums[nums.length - 1]) {
    //                     break;
    //                 } else {
    //                     array.push(nums[i]);
    //                 }
    //             }
    //             var headerString = array.toString();
    //             var remove_comma = headerString.replace(/\,/g, "");
    //             var remove_dash = remove_comma.replace(/\s/g, "-");
    //             var order_num = remove_dash.replace(/\-/, "");
    //             cy.get(".web_grid > tbody > tr > td").each(function (td, idx) {
    //                 var vendor = "Stuff And More";
    //                 var qty = `(qty is locked to ${order_num}`;
    //                 var comments = "test part BOM1";
    //                 var outsource_po = [ po_num, "1", vendor, "BOM1", today, qty, "$0.00", 
    //                                     "$0.00", "Open", comments, "Packing Slip"];
    //                 cy.get(td).contains(outsource_po[idx]);
    //             });
    //         });
    //     });
    // });

    // it("Picks Parts", function () {
    //     cy.on("window:confirm", cy.stub());
    //     nav.side_menu("Pick Parts")
    //     cy.get("body").find("a").contains("Pick All Line").click();
    //     cy.get(".submit_button").contains("Update").click();
    //     nav.side_menu("Workorder")
    //     cy.get("#show_time_popup").click();
    //     cy.get("#add_work_form > .regular_time_entry").within($start_work => {
    //         cy
    //             .wrap($start_work)
    //             .find('input[type="submit"]')
    //             .contains("Start Work")
    //             .click();
    //     });
    //     cy.get("#user_work_info").within($stop_work => {
    //         //for the start and stop work function
    //         cy.wait(10000);
    //         cy.wrap($stop_work).find("button").contains("Stop Work").click();
    //     });
    //     cy.get("#chart").should("be.visible");
    // });

    // it("Invoices the WO", function () {
    //     nav.side_menu("Invoice");
    //     cy.get('input[type="number"]').focus().type(10);
    //     cy.get(".use_est_labor").click();
    //     cy.get(".fill_labor").click();
    //     cy.get("body").find("button").contains("Create Invoice").click();
    //     cy.on("window:confirm", cy.stub());
    //     cy.get("tfoot").within($tr => {
    //         $tr = "tr";
    //         cy.get($tr).last().within($th => {
    //             cy.wrap($th).should("contain", "$1,000.00");
    //         });
    //     });
    // });

    it("Uninvoices the Invoice", function () {
        cy.visit('invoice/1/view')
        var amounts = [
            "$-1,000.00",
            "$-255.00",
            "$255.00",
            "$1,000.00",
            "$10.00",
            "$50.00",
            "$-10.00",
            "$-50.00",
        ];
        var uninvoice_amounts = [
            "$-1,000.00",
            "$-255.00",
            "$255.00",
            "$1,000.00",
            "$-1,000.00",
            "$-255.00",
            "$255.00",
            "$1,000.00",
        ];
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
            assert.check_global_ledger(this.invoice_id, 'Invoice', uninvoice_amounts, 12)
        })
    });
});
