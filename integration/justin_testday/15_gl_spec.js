import Assertion from '../utils/assertions';
import Navigation from '../utils/navigation';
import General from '../utils/general';

describe("The General Ledger", function () {
	var assert = new Assertion();
	var nav = new Navigation();
	var gen = new General();
	var moment = require("moment");
	var now = moment().format("hh:mm:ss");
	var later = moment().add(1, "hours").format("hh:mm:ss");
	var [today] = gen.dates()
	var days_100 = moment().add(100, "days").format("YYYY-MM-DD");
	var days_200 = moment().add(200, "days").format("YYYY-MM-DD");
	var days_300 = moment().add(300, "days").format("YYYY-MM-DD");
	var time_frame = [days_300, days_200, days_100, today];
	beforeEach(() => {
		cy.login();
		cy.viewport(1200, 700);
		var make_new_ledger_entry = (
			name,
			desc,
			type,
			location,
			pay_ref,
			currency,
			account_1,
			account_2,
			in_1,
			in_2,
			out_1,
			out_2
		) => {
			return cy.request({
				method: "POST",
				url: "/ledger/insert_entry",
				form: true,
				body: {
					entry_name: name,
					entry_description: desc,
					payment_type_id: type,
					location_id: location,
					payment_ref: pay_ref,
					entry_currency_all_splits: currency,
					entry_account_1: account_1,
					entry_account_2: account_2,
					entry_amount_in_1: in_1,
					entry_amount_out_1: out_1,
					entry_amount_in_2: in_2,
					entry_amount_out_2: out_2,
				},
			});
		};
		cy.wrap(make_new_ledger_entry).as("make_new_ledger_entry");
	});

	it("Creates A New Account For The GL", function () {
		cy.visit("ledger/account_list");
		//if the youtube account gets created more than once the entire script will fail
		cy.get("#account_restriction_select > option").each(($option) => {
			//this stops that
			if ($option.text().includes("631000 Youtube")) {
				cy.document().then(($doc) => {
					Cypress.$($doc.body).append(`<div id='findme'>it's here</div>`);
				});
			}
		});
		//this stops that
		cy.get("body").then(($body) => {
			if ($body.find("div#findme").length == 0) {
				cy.document().then(($doc) => {
					Cypress.$($doc.body).append(`<div id='findme'>skip</div>`);
				});
			}
		});
		//this stops that
		cy.get("#findme").then(($this) => {
			if (!$this.text().includes("it's here")) {
				cy.get(".show_create_account").click();
				cy.get("#create_parent_id:visible").select(["630000 Other Income"]);
				cy.get("#account_name").type("Youtube");
				cy.get("#account_number").type("631000");
				nav.get("body", ".button2", "Create");
			}
		});
	});

	it("Edits Existing Account", function () {
		var ids = ["#description", "#bank_account_number", "#routing_number"];
		var desc = ["new account", "123456789", "987654321"];
		cy.visit("ledger/account_list");
		cy.get("#account_restriction_select").select(["631000 Youtube"], {
			force: true,
		});
		nav.get("body", ".button2", "Submit");
		cy.get("body").find("a").contains("631000").click();
		cy.wrap(ids).each((id, idx) => {
			cy.get(id).clear().type(desc[idx]);
		});
		cy.get("#account_type_id").select(["Accounts Receivable (2)"]);
		cy.get("#update_payment").click();
		assert.success("Account Updated");
		cy.window().then(($win) => {
			var id = $win.location.pathname.match(/\d*/g);
			$win.sessionStorage.setItem("account_id", id[8]);
		});
	});

	it("Creates a New Ledger Entry then Checks It", function () {
		cy.visit("ledger/account_list");
		cy.get("#account_restriction_select").select(["412000 Allowances"], {
			force: true,
		});
		nav.get("body", ".button2", "Submit");
		cy.get("body").find("a").contains("412000").click();
		cy.window()
			.then(($win) => {
				var id = $win.location.pathname.match(/\d*/g);
				cy.wrap(id[8]).as("allowances");
				cy.wrap($win.sessionStorage.getItem("account_id")).as("youtube");
			})
			.then(() => {
				//gotta do this with a request the first time because it is on an iframe...and cypress hates iframes still
				//i tried a bunch of different ways and it still doesn't work
				this.make_new_ledger_entry(
					now,
					"I'm rich",
					3,
					1,
					"hacked",
					1,
					this.youtube,
					this.allowances,
					0,
					1000000,
					1000000,
					0
				);
			});

		cy.visit("/ledger/ledger");
		cy.get("input[name='name']").type(now);
		nav.get("body", ".button2", "Submit");

		//checks the ledger
		var amounts = ["1,000,000.00", "1,000,000.00"];
		cy.get("#web_grid-ledgerledger > tbody").within(() => {
			cy.get(".Amount").each(($entry, $idx, $total) => {
				cy.wrap($total).should("have.length", 2);
				cy.get($entry).should("contain", `${amounts[$idx]}`);
			});
		});
	});

	it("Creates A Reverse Entry and Checks It", function () {
		cy.server();
		cy.route("POST", "/ledger/*/reverse_entry").as("reverse_entry");
		cy.visit("/ledger/ledger");
		cy.get("input[name='name']").type(now);
		nav.get("body", ".button2", "Submit");

		cy.get(".Split").last().find("a").click();
		cy.window().then(($win) => {
			var id = $win.location.pathname.match(/\d*/g);
			$win.sessionStorage.setItem("entry_id", id[8]);
		});
		cy.get(".show_reverse_entry").click();
		cy.get(".reverse_entry").click();
		//weird waiting issue here the wait is inconsistent
		cy.wait("@reverse_entry");
		cy.wait(2000);
		cy.get("body")
			.find("td")
			.contains("Entry Reversed By")
			.within(($td) => {
				cy.get("a").click();
			});
		cy.window()
			.then(($win) => {
				var id = $win.location.pathname.match(/\d*/g);
				cy.wrap(id[8]).as("reversing_entry_id");
			})
			.then(() => {
				cy.visit("/ledger/ledger");
				cy.get("#more_options").click();
				cy.get('input[name="entry_id"]').type(this.reversing_entry_id);
				nav.get("body", ".button2", "Submit");
			});
		//checks the ledger
		var amounts = ["1,000,000.00", "1,000,000.00"];
		cy.get("#web_grid-ledgerledger > tbody").within(() => {
			cy.get(".Amount").each(($entry, $idx, $total) => {
				cy.wrap($total).should("have.length", 2);
				cy.get($entry).should("contain", `${amounts[$idx]}`);
			});
		});
	});

	it("Creates A Split in a Ledger Entry", function () {
		cy.visit("ledger/account_list");
		cy.get("#account_restriction_select").select(["410000 Sales"], {
			force: true,
		});
		nav.get("body", ".button2", "Submit");
		cy.get("body").find("a").contains("410000").click();
		cy.window()
			.then(($win) => {
				var id = $win.location.pathname.match(/\d*/g);
				cy.wrap(id[8]).as("sales");
				cy.wrap($win.sessionStorage.getItem("account_id")).as("youtube");
			})
			.then(() => {
				this.make_new_ledger_entry(
					later,
					"still rich",
					3,
					1,
					"thanks",
					1,
					this.youtube,
					this.sales,
					500000,
					0,
					0,
					500000
				);
			});
		cy.visit("/ledger/ledger/");
		cy.get("input[name='name']").type(later);
		nav.get("body", ".button2", "Submit");
		cy.get(".Split")
			.last()
			.within(($this) => {
				cy.wrap($this).find("a").click();
			});
		cy.get(".add_split_entry").click();
		cy.wait(1000);
		cy.get(".add_split_entry").click();
		cy.wrap(["410000 Sales", "631000 Youtube"]).each((option, idx) => {
			cy.get("#entry_account_" + (idx + 3)).select(option, {
				force: true,
			});
			cy.get("input[name='entry_amount_in_3']")
				.focus()
				.clear()
				.type("500000")
				.blur();
			cy.get("input[name='entry_amount_out_4']")
				.focus()
				.clear()
				.type("500000")
				.blur();
		});
		cy.get(".submit_entry").click();
		cy.wait(1000);
		cy.get("body").find("a").contains("View Replacing Entry").click();
		cy.window()
			.then(($win) => {
				var id = $win.location.pathname.match(/\d*/g);
				cy.wrap(id[8]).as("split_entry_id");
			})
			.then(() => {
				cy.visit("ledger/ledger/");
				cy.get("input[name='entry_id']").type(this.split_entry_id);
				nav.get("body", ".button2", "Submit");
				//checks the ledger
				var amounts = [
					"500,000.00",
					"500,000.00",
					"500,000.00",
					"500,000.00",
				];
				cy.get("#web_grid-ledgerledger > tbody").within(() => {
					cy.get(".Amount").each(($entry, $idx, $total) => {
						cy.wrap($total).should("have.length", 4);
						cy.get($entry).should("contain", `${amounts[$idx]}`);
					});
				});
			});
	});
	it("Checks Editing An Entry", function () {
		cy.get(".Split")
			.last()
			.within(($this) => {
				cy.wrap($this).find("a").click();
			});
		cy.get("input[name='entry_amount_in_1']").focus().clear().type(1).blur();
		cy.get("#current_total").should(
			"contain",
			"Entry Not Balanced; Difference is -499999"
		);
		cy.get("input[name='entry_amount_in_1']")
			.focus()
			.clear()
			.type(500000)
			.blur();
	});
	it("Creates Recurring Entry", function () {
		cy.get("#create_recurring").click();
		assert.success();
		cy.get("input[name='period_value']").clear().type(100);
		nav.get("body", ".button2", "Update");
		cy.get('table[id*="web_grid-glentryrecurring"] > tbody ').within(() => {
			cy.get(".Date").each(($entry, $idx, $total) => {
				cy.wrap($total).should("have.length", 4);
				cy.get($entry).should("have.text", `${time_frame[$idx]}`);
			});
		});
	});
	it("Creates A Retained Earnings Entry", function () {
		cy.server();
		cy.route("POST", "/ledger/*/update_entry").as("update_entry");
		cy.get(".ID")
			.last()
			.within(($this) => {
				cy.wrap($this).find("a").click();
			});
		cy.wait(1000);
		cy.get("input[name='retained_earnings']").check();
		cy.get(".submit_entry").click();
		cy.wait("@update_entry");
		cy.visit("accounting/retained_earnings_list");
		cy.get(
			'table[id*="web_grid-accountingretainedearningslist"] > tbody '
		).within(($grid) => {
			cy.wrap($grid).should("contain", later);
		});
	});
});
