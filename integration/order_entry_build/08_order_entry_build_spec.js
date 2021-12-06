//log save main menu search in navigation
import Navigation from '../../utils/navigation';
import Assertion from '../../utils/assertions';
import Part from '../../utils/part';
import Quote from '../../utils/quotes';

describe("The Order Entry Build", function () {
    const nav   = new Navigation(),
        assert  = new Assertion(),
        part    = new Part(),
        quote   = new Quote(),
        moment  = require("moment"),
        today2  = moment().format("YYYY-MM-DD");

    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });

    it("Makes a BOM", function(){
        //might be an easier way of doing it but at least it's fast
        const jsonTop = {
            prcpart: "BOMOrderEntry",
            revision_text: 'A',
            bom_definition: [
                {
                    prcpart: "PRTABC",
                    component: '1',
                    revision_text: 'A',
                    qty_per_top: '1',
                },
                {
                    prcpart: "PRTDEF",
                    component: '2',
                    revision_text: 'A',
                    qty_per_top: '2',
                },
                {
                    prcpart: "PRTGHI",
                    component: '3',
                    revision_text: 'A',
                    qty_per_top: '3',
                },
            ],
        };
        const jsonSub1 = {
            prcpart: "PRTABC",
            revision_text: 'A',
            bom_definition: [
                {
                    prcpart: "PRTJKL",
                    component: '1',
                    revision_text: '',
                    qty_per_top: '1',
                },
            ],
        };
        const jsonSub2 = {
            prcpart: "PRTDEF",
            revision_text: 'A',
            bom_definition: [
                {
                    prcpart: "PRTMNO",
                    component: '1',
                    revision_text: '',
                    qty_per_top: '1',
                },
            ],
        };
        const jsonSub3 = {
            prcpart: "PRTGHI",
            revision_text: 'A',
            bom_definition: [
                {
                    prcpart: "PRTPQR",
                    component: '1',
                    revision_text: '',
                    qty_per_top: '1',
                },
            ],
        };
        cy.request({
            method: 'GET',
            url:`/api/part/${jsonTop.prcpart}?preshared_token=cypress_api_hack`,
            failOnStatusCode: false,
        }).then((res) => {
            if(!res.body.prcpart){
                cy.request({
                    method: 'POST',
                    url:"/api/partrevisiondefinition?preshared_token=cypress_api_hack",
                    body: JSON.stringify(jsonTop),
                    headers: {"Version": "2.0"},
                    failOnStatusCode: true,
                }).then(() => {
                    Promise.all([
                        cy.request({
                            method: 'POST',
                            url:"/api/partrevisiondefinition?preshared_token=cypress_api_hack",
                            body: JSON.stringify(jsonSub1),
                            headers: {"Version": "2.0"},
                            failOnStatusCode: true,
                        }),
                        cy.request({
                            method: 'POST',
                            url:"/api/partrevisiondefinition?preshared_token=cypress_api_hack",
                            body: JSON.stringify(jsonSub2),
                            headers: {"Version": "2.0"},
                            failOnStatusCode: true,
                        }),
                        cy.request({
                            method: 'POST',
                            url:"/api/partrevisiondefinition?preshared_token=cypress_api_hack",
                            body: JSON.stringify(jsonSub3),
                            headers: {"Version": "2.0"},
                            failOnStatusCode: true,
                        }),
                    ]);
                })
            }
        });

    });

    it("Receives enough parts to make sure it doesnt run out", function () {
        part.receives_stock_from_api(["PRTABC", "PRTDEF", "PRTGHI","PRTJKL", "PRTMNO", "PRTPQR"], 100)
    });

    it("Creates a New Build Order", function () {
        quote.new_order([{prcpart: 'BOMOrderEntry', transcode: 'SA' }]);
        cy.get(".table_show_hide_touched").contains("Build");
    });

    it("Creates An Outsouce PO", function () {
        nav.side_menu("Workorder")
        nav.side_menu("Line 1")
        nav.side_menu("Outsource")
        cy.get("#vendor_search").type("Stuff And");
        nav.get_dropdown("Stuff And More")
        cy.get("#prcpart").type("BOMOrderEntry");
        cy.get("#comments").type("test part BOMOrderEntry");
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
                    po_num,"1","Stuff And More","BOMOrderEntry",today2,`(qty is locked to ${order_num}`, 
                    "$0.00","$0.00","Open","test part BOMOrderEntry","Packing Slip"
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
        cy.get("#add_work_form > .block_time_entry").scrollIntoView().find('#add_and_close_hours').focus().type(3).blur();
        cy.get("#add_work_form").find('.submit_form').last().click();
    	cy.wait(3000);
        cy.get("#chart").should("be.visible");
        cy.get('[data-cy=time_logged]').invoke('text').should('contain', 180)
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

    it("Saves the Invoice Object ID", function(){
        cy.window().then($win => {
    		$win.sessionStorage.setItem("invoice_id", $win.location.pathname.match(/\d+/)[0]);
        });
    });

    it("Uninvoices the Invoice", function () {
        nav.side_menu("Uninvoice");
        cy.on("window:confirm", cy.stub());
        assert.success('Invoice Cancelled');
        cy.window().then($win => {
    		$win.sessionStorage.setItem("invoice_url", $win.location.pathname);
        });
    });

    it("Checks PO Reopened", function(){
        nav.side_menu("Outsource");
        nav.side_menu("View All");
        cy.get('body').find('tbody').then(tbody => {
            cy.wrap(tbody).find('tr').first().find('td').first().should('contain', 'open');
        });
    });
            
    
    it("Checks parts went back into inventory", function(){
        part.goto_prcpart("PRTABC");
        cy.get('body').find('a').contains('Unpick').should('be.visible');
        part.goto_prcpart("PRTDEF");
        cy.get('body').find('a').contains('Unpick').should('be.visible');
        part.goto_prcpart("PRTGHI");
        cy.get('body').find('a').contains('Unpick').should('be.visible');
    });

    it("Checks ledger", function(){
        cy.visit('/');
        nav.main_menu('Accounting', 'Chart/Ledger', 'Ledger');
        cy.get('#more_options').then(more_options => {
            if(more_options.is(":visible")){
                cy.wrap(more_options).click()
            }
        })
        cy.get('input[name=object_type]').type('Invoice');
        cy.window().then($win => {
            cy.get('input[name=object_id]').type($win.sessionStorage.getItem("invoice_id"));
        });
        cy.get('#quote_restrictions > table').find('.button2').click();
        cy.get('#web_grid-ledgerledger').find('.Amount').should('have.length', 5);
    });
});
