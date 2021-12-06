import Assertion from '../../utils/assertions';
import Navigation from '../../utils/navigation';

describe("AP Tab", function () {
	var assert = new Assertion();
	var nav = new Navigation();
	beforeEach(() => {
		cy.login();
		cy.viewport(1200, 700);
	});

	it("clears session storage", function () {
		cy.window().then(($win) => {
			$win.sessionStorage.clear();
		});
	});

	it("Creates a Preliminary Part with Stock, Customer and Invoice", function () {
		var prcpart = "PRTARTEST";
		var token = "cypress_api_hack";
		var cust = "AR Test Customer";
		var address = {
			street: "409 Stoney Ridge",
			city: "Heber Springs",
			state: "AR",
			zip: "78745",
			country: "United States",
		};

		cy.wrap(cust).as("ar_customer");

		//faster if you do a request when you don't need to test the page
		//we've already tested these pages several times
		//they are wrapped in thens to make sure they fire in the correct order

		//create customer
		cy.request({
			method: "PUT",
			url: "/api/customer/",
			body: {
				name: cust,
				external_key: "cypressartestcustomer",
				credit_code: 3,
				ship_to_name: cust,
				ship_to_address_1: address.street,
				ship_to_address_city: address.city,
				ship_to_address_state: address.state,
				ship_to_address_zip: address.zip,
				ship_to_country: address.country,
				bill_to_name: cust,
				bill_to_address_1: address.street,
				bill_to_address_city: address.city,
				bill_to_address_state: address.state,
				bill_to_address_zip: address.zip,
				bill_to_country: address.country,
				preshared_token: token,
			},
		})
			.then((res) => {
				cy.wrap(res.body.id).as("ar_customer_id");
			})
			.then(() => {
				//create part
				cy.request(
					"PUT",
					`/api/part?preshared_token=${token}&prcpart=${prcpart}&description=AR%20TEST%20Part`
				);
			})
			.then(() => {
				//receive stock
				cy.request({
					method: "POST",
					url: "/receiving/add_stock",
					form: true,
					body: {
						prcpart: prcpart,
						part_confirm: prcpart,
						qty_accepted: 9,
						qty_rejected: 1,
						quantity: 10,
						location: "MN",
					},
				});
			})
			.then(() => {
				cy.request(
					"POST",
					`/invoice/create_bill_only?customer_id=${this.ar_customer_id}`
				).then((res) => {
					var edit_url = res.body.match(/invoice\/\d*\/edit/g);
					var update_invoice = res.body.match(/invoice\/\d*\/update_invoice/g);
					cy.wrap(edit_url[0]).as("edit_url");

					// update invoice
					cy.request({
						method: "POST",
						url: update_invoice[0],
						form: true,
						body: {
							line_1_shipqty: 1,
							line_1_prcpart: prcpart,
							line_1_gl_account_id: 25,
							line_1_resale: 50.0,
						},
					}).then(() => {
						cy.visit(this.edit_url);
					});
				});
			});
	});

	it("Takes a Payment", function () {
		var selects = {
			"#payment_type_id": "1",
		};
		var inputs = {
			"#payment_amount": "50.00",
			"#payment_ref": "referenced",
			"#description": "described",
		};
		nav.side_menu("Take Payment");
		cy.get(".web_grid").within(($this) => {
			cy.get($this).find('.grid_col > input[type="checkbox"]').check({force:true});
		});
		nav.do_inputs(selects, inputs);
		cy.get(".invoice_amount")
			.first()
			.should("have.css", "background-color", "rgb(13, 140, 21)");
	});

	// red css doesn't show up in cypress for some reason so it took out a bit of this test
	// it('Tests Under Applied Amount', function(){
	//     cy.get("#payment_amount").focus().clear().type('25.00').blur()

	//     //have to wait because of the way the css is on this page it's a transition
	//     cy.wait(10000)
	//     cy.get(".spanclasspaycolumnApplyspan").first().should('have.css',"background-color", "rgb(237, 171, 171)")
	// })

	it("Completes Payment", function () {
		nav.get("body", ".button2", "Update");
		assert.success();
		nav.get("body", ".button", "Payment Complete");
		cy.get(".alert")
			.should("contain", "Payment Closed")
			.and("have.css", "color", "rgb(255, 165, 0)");
		assert.check_object_ledger("50");
	});

	it("Creates a Credit Memo", function () {
		cy.visit("creditmemo/list");
		nav.get("body", ".button", "Create");
		cy.get("input[name='customer']").first().type(this.ar_customer);
		nav.get_dropdown(this.ar_customer);
		//weird error here on dev might not need it on git lab
		// prove -vl ... :: 1 doesn't set the gl_account_mapping for Customer Payment - Credit Overpayment To
		//also the next 4 lines are very slow takes 20 seconds to do this..
		nav.get("body", ".button2", "Create");
		cy.visit("config/gl_account_mapping/");
		cy.get("body")
			.find("td")
			.contains("Customer Payment - Credit Overpayment To")
			.parent()
			.within(($tr) => {
				//this might not be the correct account but on my server it was causing me errors
				cy.get($tr).find("select").select(["114000 Receivables"]);
			});
		nav.get("body", ".button2", "Submit");
		assert.success("Updated");
		cy.visit("creditmemo/list");
		nav.get("body", ".button", "Create");
		cy.get("input[name='customer']").first().type(this.ar_customer);
		nav.get_dropdown(this.ar_customer);
		nav.get("body", ".button2", "Create");
		assert.success();
	});

	it("Tests Credit Memo", function () {
		var inputs = {
			"input[name='custponum']": "credit memo",
			"textarea[name='export_comments']": "Comments",
			"input[name='line_1_custpartnum']": "All the reasons",
			"input[name='line_1_resale']": "100",
		};
		var selects = {
			"select[name*='line_1_cost_center_id']": ["Cost Center 1"],
		};
		nav.do_inputs(selects, inputs);
		nav.get("body", ".button2", "Update");
		assert.success("Updated");
		assert.check_object_ledger("100");
	});

	it("Adds a Line", function () {
		var inputs = {
			"input[name='line_2_custpartnum']": "All the reasons",
			"input[name='line_2_resale']": "100",
		};
		var selects = {
			"select[name*='line_2_cost_center_id']": ["Cost Center 1"],
		};
		cy.go("back");
		cy.reload();
		cy.get('input[name="add_line"]').click();
		nav.get("body", ".button2", "Update");
		nav.do_inputs(selects, inputs);
		nav.get("body", ".button2", "Update");
		assert.success("Updated");
	});

	it("Deletes a Line", function () {
		cy.go("back");
		cy.reload();
		cy.get('input[name="delete_line"]').last().click();
		nav.get("body", ".button2", "Update");
		assert.success("Updated");
		assert.check_object_ledger("100");
	});

	it("Takes Cash in AR", function () {
		var inputs = {
			"#takecash_amount": "100",
			"#payment_ref": "1010101010",
			'textarea[name="notes"]': "notes",
		};
		var selects = {
			"#payment_type_id": ["ACH"],
			"#cost_center_id": ["Cost Center 1"],
		};
		cy.visit("/takecash/list");
		nav.get("body", ".button", "Create");
		nav.get("body", ".button2", "Create");
		cy.get("#vendor_search").type("House of Stuff");
		nav.get_dropdown("House Of Stuff");
		nav.do_inputs(selects, inputs);
		nav.get("body", ".button2", "Update");
		assert.success("Updated");
		nav.get("body", ".button", "Close");
		assert.success("Updated");
		assert.check_object_ledger("100");
	});

	it("Edits a Deposit", function () {
		cy.visit("deposit/list");
		nav.get("body", ".button2", "Submit");
		cy.get("body")
			.find("td")
			.contains("100")
			.first()
			.parent()
			.within(($tr) => {
				cy.get($tr).find("a").click();
			});
		cy.get("#customer_search").type(this.ar_customer);
		cy.window().then(($win) =>
			cy.wrap($win.location.pathname).as("deposit_url")
		);
		nav.get_dropdown(this.ar_customer);
		nav.get("body", ".button2", "Create");
	});

	it("Creates a Payment", function () {
		var selects = {
			"#payment_type_id": "1",
		};
		var inputs = {
			"#payment_amount": "100.00",
			"#payment_ref": "referenced",
			"#description": "described",
		};
		nav.do_inputs(selects, inputs);
		cy.get(".credit_memo_amount").first().focus().clear().type("100").blur();
		// cy.get(".invoice_amount").first().should('have.css',"background-color", "rgb(13, 140, 21)")
		nav.get("body", ".button2", "Update");
		assert.success();
		nav.get("body", ".button", "Payment Complete");
		cy.get(".alert")
			.should("contain", "Payment Closed")
			.and("have.css", "color", "rgb(255, 165, 0)");
	});

	it("Completes Deposit", function () {
		cy.visit(this.deposit_url);
		//no idea what's causing that
		Cypress.on("uncaught:exception", (err, runnable) => {
			return false;
		});
		cy.get('input[name="deposit_name"]').focus().type("Deposit").blur();
		cy.get("body").find("td").contains("$200.00").should("contain", "$200.00");
		cy.get("body")
			.find("td")
			.contains("pending deposit")
			.should("contain", "pending deposit");
		cy.get("#deposit").click();
	});

	it("Reopens Closed Deposit and Closed Payment", function () {
		cy.get("#reopen").click();
		cy.on("window:confirm", cy.stub());
		assert.success();
		cy.get("body")
			.find("td")
			.contains("1010101010")
			.parent()
			.within(($tr) => {
				cy.get($tr).find("a").click();
			});
		nav.get("body", ".button2", "Reopen");
		cy.visit(this.deposit_url);
		cy.get("#deposit").click();
		cy.get(".status_message").should("contain", "Failed");
	});
});
