import Assertion from '../../utils/assertions';
import Navigation from '../../utils/navigation';
import Part from '../../utils/part';
import PO from '../../utils/pos';
import General from '../../utils/general';

var nav    = new Navigation(),
    assert = new Assertion(),
    part   = new Part(),
    po 	   = new PO(),
    gen    = new General();
describe("AP Tab", function () {

	beforeEach(() => {
		cy.login();
		cy.viewport(1200, 700);
	});

	it("clears session storage", function() {
		cy.window().then($win => {
			$win.sessionStorage.clear();
		})
	})

	it("Creates and checks PQuote/PO", function () {
		var taxes 	 = 1,
		    noninventory = 1,
		    amount 	 = "10",
		    freight      = 10.0,
		    prcparts 	 = ["PRTNONINV", "PRTINV"],
		    lines        = [
				{ prcpart: prcparts[0], qty: amount },
				{ prcpart: prcparts[1], qty: amount },
			];
		cy.server();
		cy.route("POST", "/part/*/update_profile").as("update");
		var counter = 0;
		for (let prcpart of prcparts) {
			if (counter != 1) {
				part.create_prcpart(prcpart, "", noninventory);
			} else {
				part.create_prcpart(prcpart);
			}
			cy.visit("/part/list");
			cy.get('input[name="part_search"]').type(prcpart);
			nav.get("body", ".button2", "Submit");
			cy.get("td.Part").find("a").click();
			nav.side_menu("Edit");
			cy.get('input[name="last_resort_cost"]').clear().type(10.0);
			cy.get("[data-cy=update_profile]").click();
			cy.wait("@update");
			cy.wait(2000);
			counter++;
		}
		po.create_purchaseorder(lines, taxes, freight);
		//this is pretty useful
		cy.get("tfoot > tr").each(($this) => {
			if ($this.text().includes("Pretax:")) {
				cy.get($this).should("contain", "$200.00");
			} else if ($this.text().includes("Tax Estimate:")) {
				cy.get($this).should("contain", "$20.00");
			} else if ($this.text().includes("Freight:")) {
				cy.get($this).should("contain", "$10.00");
			} else if ($this.text().includes("Unvouchered:")) {
				cy.get($this).should("contain", "$230.00");
			} else if ($this.text().includes("Orig Total:")) {
				cy.get($this).should("contain", "$230.00");
			} else {
				cy.log("Other rows");
			}
		});
	});

	it("Splits PO Lines", function () {
		nav.side_menu("Edit");
		cy.get("#order-lines > tbody").each(($tbody, $idx) => {
			if ($idx == 2) {
				nav.get($tbody, "span", "Advanced");
			}
			if ($idx == 3) {
				nav.get($tbody, ".button", "Split PO Line");
				nav.get($tbody, 'input[name*="split_po_line_"]').type(5);
				nav.get($tbody, ".button2", "Ok");
			}
		});
		//detached from the dom
		cy.get("#order-lines > tbody").each(($tbody, $idx, $arr) => {
			cy.get($arr).should("have.length", 6);
		});
		nav.side_menu("View");

		//should still be the same
		cy.get("tfoot > tr").each(($this) => {
			if ($this.text().includes("Pretax:")) {
				cy.get($this).should("contain", "$200.00");
			} else if ($this.text().includes("Tax Estimate:")) {
				cy.get($this).should("contain", "$20.00");
			} else if ($this.text().includes("Freight:")) {
				cy.get($this).should("contain", "$10.00");
			} else if ($this.text().includes("Unvouchered:")) {
				cy.get($this).should("contain", "$230.00");
			} else if ($this.text().includes("Orig Total:")) {
				cy.get($this).should("contain", "$230.00");
			} else {
				cy.log("Other rows");
			}
		});
		//Making sure that the line actually split on the view
		cy.get("#po-lines > tbody > tr").each(($tr, $idx) => {
			if ($tr.text().includes("PRTINV")) {
				cy.document().then(($doc) => {
					Cypress.$($doc.body).append(`<div class=cypress>${$idx}</div>`);
				});
			}
		});
		//the length will be 1 if it doesn't split
		cy.get(".cypress").should("have.length", 2);
	});

	it("Checks PO Receipt", function () {
		cy.server();
		cy.route("GET", "/document/object_images?object_type=Part&object_id=**").as(
			"xhr"
		);
		cy.window().then(($win) => {
			var po_url = $win.location.pathname;
			$win.sessionStorage.setItem("po_url", po_url);
		});
		cy.get("#po-lines > tbody > tr").each(($tr, $idx) => {
			if ($idx == 2) {
				nav.get($tr, "a", "Receive");
			}
		});
		cy.wait("@xhr");
		cy.get("#cost").clear().blur();
		cy.get("#qty_accepted").clear().type(5);
		cy.get("#receive_next_line").click();
		cy.window().then(($win) => {
			cy.visit($win.sessionStorage.getItem("po_url"));
		});
		cy.get("#po-lines > tbody > tr").each(($tr, $idx) => {
			if ($tr.text().includes("Receipt:")) {
				nav.get($tr, "a");
			}
		});

		//command.js file
		assert.assert_row("#order-lines-container > div", "Cost", ["$0.00", "5"]);

		cy.window().then(($win) => {
			var url = $win.sessionStorage.getItem("po_url");
			cy.visit(url);
		});
	});

	it("Creates 1st Voucher", function () {
		// command.js file
		var ids = [
			"#associate_po_lines_all",
			"#associate_receipts_all",
			"#associate_freight",
			"#associate_tax",
			"#update_voucher_button2",
		];
		cy.server();
		cy.route(
			"GET",
			"/purchaseorder/get_lines?for_voucher=1&only_non_inv=*&po_id=*"
		).as("getPlines");

		cy.get_quote_po_or_order_num("po_num");
		nav.get(".quote-header > table > tbody", "a", "House Of Stuff");
		nav.side_menu("Create Voucher");
		cy.get("#invoicenum").type(gen.info(8))
		// for(let i = 0; i < 2; i++){
		cy.window().then(($win) => {
			var po_num = $win.sessionStorage.getItem("po_num");
			cy.get("#po_search").type(po_num);
			nav.get_dropdown(po_num);
		});
		cy.wait("@getPlines");
		//extra precaution
		cy.wait(2000);
		cy.wrap(ids).each(($this) => {
			cy.get($this).click();
		});
		cy.on("window:confirm", cy.stub());
		cy.get("#amount_approved").should("contain", "$120.0000");
		// //test the drop function
		// if(i == 0){
		// 	cy.get('body').find('input[type="checkbox"]').each(($cb, $idx) => {
		// 		if($idx == 0){
		// 			cy.log('Skip')
		// 		}else {
		// 			cy.get($cb).click();
		// 		}
		// 	})
		// 	cy.get(ids[4]).click();
		// 	cy.on("window:confirm", cy.stub());
		// 	cy.get('#po_attachments > tr').each($tr => {
		// 		cy.get($tr).find('a').last().click();
		// 		cy.on("window:confirm", cy.stub());
		// 	})
		// 	//this might be a bug because you can't drop the tax
		// 	cy.get('#amount_approved').should('contain', "$10.0000")
		// }else{
		//no idea why I need to this
		// Cypress.on("uncaught:exception", (err, runnable) => {
		// 	return false;
		// });
		cy.get("#request_amount").focus().clear().type(120.0);
		cy.get("#update_voucher_button").click();
		cy.get("fieldset")
			.last()
			.within(() => {
				cy.get(".button").contains("Pay").click();
			});
		// }
		// }
		cy.get(".alert").should("contain", "Voucher Closed");
		// cy.get(".quote-header")
		// 	.last()
		// 	.then(($this) => {
		// 		//command.js
		// 		assert.assert_row("", "State", ["Paid"]);
		// 	});
		cy.window().then(($win) => {
			var url        = $win.location.pathname,
			   nums        = url.match(/\d|[0-9][0-9]/g),
			   regex       = /\,/g,
			   voucher_num = '';
			if (regex.test(nums)) {
				voucher_num = nums.toString().replace(/\,/g, "");
			} else {
				voucher_num = nums;
			}
			$win.sessionStorage.setItem("voucher_num", voucher_num);
		});
		nav.side_menu("Ledger");

		//big table assertion
		var accounts_object = {
			"#Accrued": "$100.00",
			"#AccountsPayable": "$-120.00",
			"#SalesTax": "$10.00",
			"#FreightIn": "$10.00",
		};
		//all this does is make sure that the table trs have the correct voucher id
		//then puts the account names and amounts into divs in the dom to be asserted later
		cy.get("#web_grid-ledgerledger > tbody > tr").each(($tr, $idx) => {
			cy.get($tr).within(() => {
				cy.get(".ObjectID").then(($this) => {
					cy.window().then(($win) => {
						var voucher_num = $win.sessionStorage.getItem("voucher_num");
						if ($this.text().includes(voucher_num)) {
							cy.get($tr).within(() => {
								cy.get(".Account")
									.first()
									.then(($text) => {
										var id = $text.text().replace(/\s*/g, "");
										cy.get($tr).within(() => {
											cy.get(".Amount").then(($amount) => {
												var amount = $amount.text();
												cy.document().then(($doc) => {
													Cypress.$($doc.body).append(
														`<div id="${id}">${amount}</div>`
													);
												});
											});
										});
									});
							});
						}
					});
				});
			});
		});
		//the key is the id of the appended div. it is appended to make it easier to find and not have to breakout of the loop
		//the key also makes sure that the correct account was hit
		//if it fails this will give an error and won't exist
		Object.keys(accounts_object).forEach((key, idx) => {
			cy.get(`${key}`).should("contain", accounts_object[key]);
		});
	});
	it("Creates 2nd Voucher", function () {
		cy.server();
		cy.route("GET", "/document/object_images?object_type=Part&object_id=**").as(
			"xhr"
		);
		cy.route(
			"GET",
			"/purchaseorder/get_lines?for_voucher=1&only_non_inv=*&po_id=*"
		).as("getPlines");
		var ids = ["#associate_receipt", "#associate_freight", "#associate_tax"];
		var header_ids = [
			"#invoicenum",
			"#internal_notes",
			"#external_notes",
			"#update_voucher_button",
		];

		cy.window().then(($win) => {
			cy.visit($win.sessionStorage.getItem("po_url"));
		});
		cy.get("#po-lines").find("a").contains("Receive").last().click();
		cy.wait("@xhr");
		cy.get("#qty_accepted").scrollIntoView().clear().type(5);
		cy.get("#receive_next_line").click();
		cy.window().then(($win) => {
			cy.visit($win.sessionStorage.getItem("po_url"));
		});
		cy.get("#po-lines > tbody > tr.table_show_hide_touched").eq(2).find("a").click();
		assert.assert_row(".quote-header", "Cost", ["$10.00", 5]);
		nav.get("body", "a", "House Of Stuff");
		nav.side_menu("Create Voucher");
		cy.window().then(($win) => {
			var po_num = $win.sessionStorage.getItem("po_num");
			cy.get("#po_search").type(po_num);
			nav.get_dropdown(po_num);
		});
		cy.wait("@getPlines");
		cy.wait(2000);
		cy.wrap(ids).each(($id) => {
			cy.get($id).click();
		});
		cy.get("#amount_approved").should("contain", "$50.00");
		cy.wrap(header_ids).each(($id, $idx) => {
			if ($idx == 3) {
				cy.get($id).click();
			} else {
				cy.get($id).type(gen.info(5))
			}
		});

		cy.get("#amount_approved").should("contain", "$55.0000");
		cy.get("#request_amount").focus().clear().type("$55.00");
		cy.get("#update_voucher_button").click();
		cy.window().then(($win) => {
			var url  	= $win.location.pathname,
			    nums 	= url.match(/\d|[0-9][0-9]/g),
			    regex 	= /\,/g,
			    voucher_num = '';
			if (regex.test(nums)) {
				voucher_num = nums.toString().replace(/\,/g, "");
			} else {
				voucher_num = nums;
			}
			$win.sessionStorage.setItem("voucher_num", voucher_num);
		});
		nav.side_menu("Ledger");
		//another big assertion
		var accounts_object = {
			"#Accrued": "$50.00",
			"#AccountsPayable": "$-55.00",
			"#SalesTax": "$5.00",
		};
		cy.get("#web_grid-ledgerledger > tbody > tr").each(($tr, $idx) => {
			cy.get($tr).within(() => {
				cy.get(".ObjectID").then(($this) => {
					cy.window().then(($win) => {
						var voucher_num = $win.sessionStorage.getItem("voucher_num");
						if ($this.text().includes(voucher_num)) {
							cy.get($tr).within(() => {
								cy.get(".Account")
									.first()
									.then(($text) => {
										var id = $text.text().replace(/\s*/g, "");
										cy.get($tr).within(() => {
											cy.get(".Amount").then(($amount) => {
												var amount = $amount.text();
												cy.document().then(($doc) => {
													Cypress.$($doc.body).append(
														`<div id="${id}">${amount}</div>`
													);
												});
											});
										});
									});
							});
						}
					});
				});
			});
		});
		Object.keys(accounts_object).forEach((key, idx) => {
			cy.get(`${key}`).should("contain", accounts_object[key]);
		});
	});

	it("Creates a Debit Memo", function () {
		cy.visit("/debitmemo/list");
		nav.get("#show_create_debit");
		cy.get("#new_vendor:visible").type("House Of Stuff");
		nav.get_dropdown("House Of Stuff");
		nav.get("body", ".button2", "Create");
		cy.get("#vendor_search").should("have.value", "House Of Stuff");
		cy.get('input[name="debit_amount"]').focus().clear().type("$10.00");
		cy.get('input[name="description"]').clear().type("justinmemo");
		nav.get("body", ".button2", "Update");
		cy.window().then(($win) => {
			var url  	  = $win.location.pathname,
			    nums 	  = url.match(/\d|[0-9][0-9]/g),
			    regex 	  = /\,/g,
			    debitmemo_num = '';
			if (regex.test(nums)) {
				debitmemo_num = nums.toString().replace(/\,/g, "");
			} else {
				debitmemo_num = nums;
			}
			$win.sessionStorage.setItem("debitmemo_num", debitmemo_num);
		});
		nav.side_menu("Ledger");
		var accounts_object = {
			"#Accrued": "$-10.00",
			"#AccountsPayable": "$10.00",
		};
		cy.get("#web_grid-ledgerledger > tbody > tr").each(($tr, $idx) => {
			cy.get($tr).within(() => {
				cy.get(".ObjectID").then(($this) => {
					cy.window().then(($win) => {
						var debitmemo_num = $win.sessionStorage.getItem("debitmemo_num");
						if ($this.text().includes(debitmemo_num)) {
							cy.get($tr).within(() => {
								cy.get(".Account")
									.first()
									.then(($text) => {
										var id = $text.text().replace(/\s*/g, "");
										cy.get($tr).within(() => {
											cy.get(".Amount").then(($amount) => {
												var amount = $amount.text();
												cy.document().then(($doc) => {
													Cypress.$($doc.body).append(
														`<div id="${id}">${amount}</div>`
													);
												});
											});
										});
									});
							});
						}
					});
				});
			});
		});
		Object.keys(accounts_object).forEach((key, idx) => {
			cy.get(`${key}`).should("contain", accounts_object[key]);
		});
	});

	it("Creates and Pays AP Entry", function () {
		cy.visit("/appayment/list");
		cy.get("#vendor_search").type("House Of Stuff");
		nav.get_dropdown("House Of Stuff");
		nav.get("body", ".button2", "Create");
		cy.window().then($win => {
			var url = $win.location.pathname;
			var id = url.replace(/\//g, '');
			var voucher_num = $win.sessionStorage.getItem('voucher_num');
			cy.get("#voucher_grid-" + id).within(() => {
				cy.get("#include_voucher_" + voucher_num).check();
				cy.get("#discount_" + voucher_num).focus().clear().type(5.0);
			})
		})
		nav.get("body", ".button2", "Update");
		nav.get("body", ".button2", "Update");
		nav.get("body", ".button", "Mark As Paid");
		cy.window().then(($win) => {
			var url = $win.location.pathname;
			$win.sessionStorage.setItem("ap_url", url);
			var nums   = url.match(/\d|[0-9][0-9]/g),
			    regex  = /\,/g,
			    ap_num = '';
			if (regex.test(nums)) {
				ap_num = nums.toString().replace(/\,/g, "");
			} else {
				ap_num = nums;
			}
			$win.sessionStorage.setItem("ap_num", ap_num);
		});
		nav.side_menu("Ledger");
		var accounts_object = {
			"#AccountsPayable": "$55.00",
			"#Discounts": "$-5.00",
			"#Cash": "$-50.00",
		};
		cy.get("#web_grid-ledgerledger > tbody > tr").each(($tr, $idx) => {
			cy.get($tr).within(() => {
				cy.get(".ObjectID").then(($this) => {
					cy.window().then(($win) => {
						var ap_num = $win.sessionStorage.getItem("ap_num");
						if ($this.text().includes(ap_num)) {
							cy.get($tr).within(() => {
								cy.get(".Account")
									.first()
									.then(($text) => {
										var id = $text.text().replace(/\s*/g, "");
										cy.get($tr).within(() => {
											cy.get(".Amount").then(($amount) => {
												var amount = $amount.text();
												cy.document().then(($doc) => {
													Cypress.$($doc.body).append(
														`<div id="${id}">${amount}</div>`
													);
												});
											});
										});
									});
							});
						}
					});
				});
			});
		});
		Object.keys(accounts_object).forEach((key, idx) => {
			cy.get(`${key}`).should("contain", accounts_object[key]);
		});
	});

	it("Undo Payment", function () {
		cy.window().then(($win) => {
			var ap_url = $win.sessionStorage.getItem("ap_url");
			cy.visit(ap_url);
		});
		nav.get("body", ".button", "Mark As Unpaid");
		nav.side_menu('Ledger');
		var upaid_values = {
			"$55.00": true,
			"$-50.00": true,
			"$5.00": true,
			"$50.00": true,
			"$-5.00": true,
			"$-55.00": true,
		};
		cy.get("#web_grid-ledgerledger > tbody > tr").each(($tr) => {
			cy.get($tr).within(() => {
				cy.get("td.Amount").invoke('text').then($text => {
					cy.wrap(upaid_values[$text]).should('eq', true);
				});
			})
		});
		cy.window().then(($win) => {
			var ap_url = $win.sessionStorage.getItem("ap_url");
			cy.visit(ap_url);
		});
		cy.window().then($win => {
			var url           = $win.location.pathname,
			    id 		  = url.replace(/\//g, ''),
			    voucher_num	  = $win.sessionStorage.getItem('voucher_num'),
			    debitmemo_num = $win.sessionStorage.getItem('debitmemo_num');
			cy.get("#voucher_grid-" + id).within(() => {
				cy.get("#discount_" + voucher_num).focus().clear();
			})

			cy.get("#debitmemo_grid-" + id).within(() => {
				cy.get('tr').each($tr => {
					cy.get($tr).within(() => {
						cy.get('.DebitMemo').then($dm => {
							if($dm.text().includes(debitmemo_num)){
								cy.get($tr).within( () => {
									cy.get(".debit_memo_amount").focus().clear().type(10).blur();
								})
							}
						})
					})
				})
			})
		})
		nav.get("body", ".button2", "Update");
		nav.get("body", ".button", "Mark As Paid");
		nav.side_menu("Ledger");
		var accounts_object = {
			// ".AccountsPayable": "$70.00",
			// ".AccountsPayable": "$-10.00",
			"#Cash": "$-45.00",
			
		};
		cy.get("#web_grid-ledgerledger > tbody > tr").each(($tr, $idx) => {
			cy.get($tr).within(() => {
				cy.get(".ObjectID").then(($this) => {
					cy.window().then(($win) => {
						var ap_num = $win.sessionStorage.getItem("ap_num");
						if ($this.text().includes(ap_num)) {
							cy.get($tr).within(() => {
								cy.get(".Account")
									.first()
									.then(($text) => {
										var id = $text.text().replace(/\s*/g, "");
										cy.get($tr).within(() => {
											cy.get(".Amount").then(($amount) => {
												var amount = $amount.text();
												cy.document().then(($doc) => {
													Cypress.$($doc.body).append(
														`<div id="${id}">${amount}</div>`
													);
												});
											});
										});
									});
							});
						}
					});
				});
			});
		});
		Object.keys(accounts_object).forEach((key, idx) => {
			cy.get(`${key}`).should("contain", accounts_object[key]);
		});
	});
});
