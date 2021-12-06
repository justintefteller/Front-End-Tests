import Navigation from '../../utils/navigation';
import Assertion from '../../utils/assertions';
import General from '../../utils/general';
import Quotes from '../../utils/quotes';
import Part from '../../utils/part';

describe("The Order Entry Stock Tab", function () {
    var nav = new Navigation();
    var assert = new Assertion();
    var gen = new General();
    var quote = new Quotes();
    var part = new Part();
    var moment = require("moment");
    var rightNow = moment().format("hh-mm-ss");
    var [today,futureDate] = gen.dates()
    var today2 = moment().format("YYYY-MM-DD");

    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });

    it("Receives Stock", function () {
        part.check_initial_data_exists();
        var prcparts = ["CMP1"];
        part.receives_stock_from_api(prcparts, 300)
    });

    it("Creates a Quote/Order", function () {
        var lines = [{ prcpart: 'CMP1', qty: 5, transcode: 'stock', cost: 5, resale: 50 }];
        quote.new_order(lines);
    });

    it('Edits the Header', function () {
        var header_input_ids = {
            "#customer_search": 'Acme Goods',
            "#oorderdate": today,
            "#buyer": 'Justin',
            "#custponum": rightNow,
            "#billto_attn_line": 'Justin',
            "#freight_resale": 10,
            "#shipping_account": rightNow,
            "#carrier_account": rightNow,
            "#name": 'Justin',
            'textarea[name="internal_comments"]': "secret",
            'textarea[name="shipping_instructions"]': "ship me plz"
        }
        var header_assertion_ids = {
            "#street1": 'Acme Supply',
            'input[name="billto_street1"]': '1235 Main Street',
            "#street3": '',
            "#street4": '',
            "#city": 'Austin',
            "#state": 'MN',
            "#zip": '78704',
        }
        var header_select_ids = {
            "#location": 'MZ',
            "#shipvia": "2",
            "#ordertype": 'S',
            "#terms": '1',
            "#fob": 'D',
            "#cost_center_id": '1',
        };

        var objects = [header_input_ids, header_assertion_ids, header_select_ids];

        nav.side_menu('Edit')

        for (let object = 0; object < objects.length; object++) {
            //because there are 2 of the same ids on the page...
            Cypress.on("uncaught:exception", (err, runnable) => {
                return false;
            });
            Object.keys(objects[object]).forEach((key, idx) => {
                if (object == 0)
                    cy.get(key).focus().clear().type(objects[object][key]).blur();
                else if (object == 1)
                    cy.get(key).should("have.value", objects[object][key]);
                else if (object == 2)
                    cy.get(key).select(objects[object][key]);
            });
        }
        cy.get('#update_order').click();
    });

    it('Updates Order Lines', function () {
        var line_input_ids = {
            "#balancedue_": "10",
            "#cost_": '10',
            "#resale_": 100,
            "#promisedate_": futureDate,
            "#orig_shipdate_": today,
            "#duedate_": futureDate,
            "#quote_comments_": "Sweet",
            "#sourcing-": 'Dude',
            "#comment1_": 'Justin',
            "#comment2_": 'Tefteller'
        }
        var line_select_ids = {
            // "#workcenter_": '100',
            "#shipto_id_": '4',
            "#add_tax_to_line_": '5',
        }
        var line_checkbox_ids = {
            "#r_and_d_": "checked",
        }
        var objs = [line_input_ids, line_select_ids, line_checkbox_ids];

        cy.get('#order-lines > tbody > tr').each($tr => {
            if ($tr.text().includes('Advanced')) {
                cy.get($tr).click()
            }
        });
        cy.get(".transcode_select").then($this => {
            var line_number = Cypress.$($this).attr('line_id');
            for (let i = 0; i < objs.length; i++) {
                Object.keys(objs[i]).forEach((key, idx) => {
                    if (i == 0)
                        cy.get(key + line_number).clear().type(objs[i][key])
                    else if (i == 1)
                        cy.get(key + line_number).select(objs[i][key])
                    else if (i == 2)
                        cy.get(key + line_number).check()
                })
            }
        })
        cy.get('#update_order').click();
        cy.get('.status_message').should('contain', "Success:")
    })

    it('Adds A Line To The Order', function() {
        var add_line_ids = {
            "click": "#add-line-button",
            "within":"#add-line-form",
            "submit": "button[id*='update_order_']"
        }
        var add_line_input_ids = {
            "#balancedue_new": '10',
            "#prcpart_new": 'CMP2',
            "#cost_new": '10',
            "#resale_new": '100',
            "#target_wip_date_new": futureDate,
            "#promisedate_new": futureDate,
            "#duedate_new": futureDate,
        }

        var add_line_select_ids = {
            "#transcode_new": "NN",
            // "#workcenter_new": today,
            "#cost_currency_new": 2,
        }
        var ids = [add_line_input_ids, add_line_select_ids];

        cy.get(add_line_ids.click).click()
        cy.get(add_line_ids.within).within($this => {
            for(let i = 0; i < ids.length; i++)
            Object.keys(ids[i]).forEach((key, idx) => {
                if(i == 0)
                cy.get(key).clear().type(ids[i][key])
                else if(i == 2)
                cy.get(key).select(ids[i][key])

            })
            cy.get(add_line_ids.submit).click()
        })
        cy.get('.status_message').should('contain', "Success:")
    })

    it('Deletes The Line', function() {
        nav.side_menu('Close Line')
        cy.get('#order-lines > tbody > tr').should('have.length', 2)
        //doing it this way because the delete line is on an iFrame
        cy.get("input[name='delete_line']").last().then($this => {
            var line_id = $this.attr('value');
            cy.url().then($url => {
                var url = $url.replace(/delete/g, 'do_delete')
                cy.request('POST', url + `?delete_line=${line_id}`).its('status').then($status =>{
                    if($status == 200){
                        cy.reload();
                    }
                });
            });
        });
        cy.get('#order-lines > tbody > tr').should('have.length', 1)
        nav.side_menu('View')
    });

    it('Asserts the Order', function () {
        var header_ids = {
            "#header-customer": "ABC",
            "#header-location": "MZ",
            "#header-ordered-on": today,
            "#header-buyer": "Justin",
            "#header-ponumber": "-",
            "#header-assembly": "No",
            "#header-shipvia": "Fedex Ground",
            "#header-email": "",
            "#header-carrier-account": "",
            "#header-tax-group": "(0%)",
            "#header-terms": "NET30",
            "#header-fob": 'D - Delivery',
            "#header-order-type": "Scheduled",
            "#header-ship-type": "Partial",
            "#header-status": "New",
            "#header-taxable": "Non-Taxable",
            "#header-resale-curr": "USD",
            "#header-credit-hold": "No",
            "#header-credit-hold-notes": "",
            "#header-shipto": "Main Street",
            "#header-internal-comments": "secret",
            "#header-shipping-instr": "ship me plz",
        }

        var line = [
            "1", "10", "Stock", "CMP1", "$10.00", "$100.00", futureDate, "$0.00", "$1,000.00"
        ]
        var rows = {
            "Custpart:": "Justin",
            "Comment:": "Tefteller",
            "Sourcing:": "Dude",
            "Tech Comments:": "Sweet",
        }
        var footer = {
            "A Tax ( 0%):": ["$0.00"],
            "Freight:": ["$0.00", "$10.00"],
            "Total:": ['$100.00', '$1,010.00']
        }
        var line_table = [rows, footer];

        cy.get('#headerSeeMore').click()
        cy.get('#order-lines-container').within(($this) => {
            Object.keys(header_ids).forEach((key) => {
                cy.get(key).should('contain', header_ids[key]);
            })
        })

        assert.assert_row('', futureDate, line);

        for (let i = 0; i < line_table.length; i++)
            Object.keys(line_table[i]).forEach(key => {
                if (i == 0)
                    assert.assert_row('', key, [line_table[i][key]]);
                else
                    assert.assert_tfoot_row('', key, line_table[i][key])
            })
    })

    it('Picks Everything and Invoices', function() {
        nav.side_menu('Workorder')
        nav.side_menu('Line 1')
        cy.location().then(function(loc) {
            cy.wrap(loc.pathname).as('pick_parts_url').then(function(){
                cy.visit('/receiving/add_stock_form?prcpart=CMP1');
                cy.get('#location').select('MZ')
                cy.get('#quantity').type(10)
                cy.get('#qty_accepted').type(10)
                cy.get('#receive_and_clear').click()
                cy.visit(this.pick_parts_url)
            });
        });
        nav.side_menu('Pick Parts')
        nav.get('body', 'a', 'Pick All Lines')
        nav.get('body', '.button2', 'Update')
        nav.side_menu('Invoice')
        nav.get('body', '.button', 'Invoice')
        cy.on('window:confirm', cy.stub());
    });

    it('Asserts Invoice', function() {
        var invoice_line = [ "1", "5", "CMP1", "Justin", "$0.00", "100.00%", "$100.00",	"$500.00" ];
        var invoice_footer = {
            "Freight:":"$10.00",
            "(Line Taxes)" : "$50.00",
            "Total:": "$560.00",
        }
        assert.assert_row('', "CMP1", invoice_line);
        Object.keys(invoice_footer).forEach(key => {
            assert.assert_tfoot_row('', key, [invoice_footer[key]]);
        })

        cy.url().should('contain', 'invoice');
    })

    it('Create Outsource PO', function() {
        var outsource_ids = {
            "#prcpart": "PRTABC1234",
            "#commit_date": today2,
            "#qty": 10,
            "#link_qty_to_ordline_id": 'click',
            "#cost": 10,
            "#comments": 'sup',
        }
        var po_line = [
            "1", "Stuff And More", "PRTABC1234",today2,"5", "(qty is locked to",	"$10.00","$50.00", "Open", "sup"
        ]
        nav.side_menu('Order')
        nav.side_menu('Workorder')
        nav.side_menu('Line 3')
        nav.side_menu('Outsource')
        cy.get('#vendor_search').type('More')
        nav.get_dropdown('More')
        cy.get('fieldset').each(($this, $idx) => {
            if($idx == 1){
                Object.keys(outsource_ids).forEach(key => {
                    if(outsource_ids[key] == 'click'){
                        cy.get(key).click()
                    }else {
                        cy.get(key).focus().type(outsource_ids[key]).blur()
                    }
                })
            }
        })
        nav.get('body', '.button2', 'Create Outsource PO')
        cy.get('.status_message').should('contain', "Success:")
        assert.assert_row('', 'Packing Slip', po_line);
    })

//    it('Invoices Next Line', function() {
//        nav.side_menu('Pick Parts')
//        nav.get('body', 'a', 'here')
//        cy.get('input[type="number"]').focus().clear().type(5).blur()
//        cy.wait(2000)
//        cy.get('input[type="checkbox"]').each($cb => {
//            cy.get($cb).check();
//        })
//        nav.get('body', '.button', 'Invoice')
//        cy.reload()
//        nav.get('body', '.button', 'Invoice')
//        cy.get('.status_message').should('contain', "Success:")
//        nav.side_menu('Order');
//        nav.side_menu('Outsource');   // can't find Outsource after Wagen's changes
//        cy.get('.alert').first().should('contain', 'PO Header is Closed')
//    })
//
//    it('Drops Ships an Order', function() {
//        
//        var drop_ship = 1;
//        var lines = [{ prcpart: 'CMP1', qty: 100, transcode: 'charge', resale: 2}];
//        var po_line = ['1','CMP1', today, '100',	'0', '$1,000.0000',	'Open'];
//        var asserts = {
//            "Line Subtotal:":"$1,000.00",
//            "Freight:":"$0.00",		 
//            "Orig Total:":"$1,000.00",
//            "Vouchered (open):":"$0.00",
//            "Paid:":"$0.00",		
//            "Unpaid / Unvouchered:":"$1,000.00",
//        }
//        quote.new_order(lines, drop_ship);
//        nav.side_menu('PO');  // can't find PO  after Wagen's changes
//        assert.assert_row('', 'CMP1', po_line);
//        Object.keys(asserts).forEach(key => {
//            assert.assert_tfoot_row('', key, [asserts[key]]);
//        })
//        nav.side_menu('Order')
//        nav.side_menu('Invoice')
//        nav.get('body', '.button', 'Invoice')
//        cy.get('.status_message').should('contain', "Success:")
//    });

    it('Warehouse Transfer', function() {
        cy.visit("quote/list");
		cy.get(".button").contains("Create").click();
		cy.get(".edit-header-button").click();
		cy.get("#customer_search").type("Internal");
        nav.get_dropdown('Internal')
        cy.get("#custponum").type(gen.info(7));
		cy.get("#seeMore").click();
		cy.get('input[name="wh_transfer"]').click();
		cy.get("#update_header_button").click();
		cy.get(".wh_transfer_theme").contains("Warehouse Transfer");
		cy.get("#quick_prcpart").type("CMP1").then($qty => {
			var linenum = Cypress.$($qty).attr("linenum");
			cy.get("#qty_" + linenum).clear().type(10);
		});
		cy.get("#add_newline").click();
        cy.wait(2000)
        cy.get(".vertical_nav_notab").find("a").contains("Commit").click();
        cy.wait(10000)
        cy.get("#location").select("MZ");
		cy.get("#place-order-button").click();
		cy.get(".status_message_container").contains("Created PO");
		cy.get(".vertical_nav_notab").find("a").contains("Internal PO").click();
		cy.get(".quote-header > table > tbody > tr").within($td => {
			$td = "td";
			cy.get($td).eq(1).contains("MZ");
        });
        cy.go("back");
		cy.get(".vertical_nav_notab").find("a").contains("Complete").click();
		cy.get("input[type='number']").then($num => {
			var ordline_id = Cypress.$($num).attr("ordline_id");
			cy.get("#pick_" + ordline_id).find("a").contains("Pick").click();
		});
		cy.get("#submit_pick").find("a").contains("Pick All Lines").click();
		cy.get(".button2").contains("Update").click();
		cy.wait(5000);
		cy.get(".vertical_nav_notab").find("a").contains("Complete").click();
		cy.get("#create_invoice").click();
		cy.on("window:confirm", cy.stub());
		cy
			.get(".quote-header > table > tbody > tr > td")
			.find("a")
			.contains("CMP")
			.click();
		cy.get(".MZ > table > thead > tr").next().next().within($td => {
			$td = "td";
			cy.get($td).eq(0).then($td => {
				expect($td).not.be.empty;
			});
		});
    })

});
