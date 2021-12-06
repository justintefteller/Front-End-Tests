// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import Navigation from '../utils/navigation'
const nav = new Navigation();

Cypress.Commands.add("login", () => {
	cy.request({
		url: "/auth/login",
		method: "POST",
		form: true,
		followRedirect: false,
		body: {
			username: "techx",
			password: "ATreeGrowsSlowly531",
		},
	});

	cy.request({
		url: "/auth/eula",
		method: "POST",
		form: true,
		followRedirect: false,
		body: {
			i_agree: "1",
		},
	});

	//global set api config for cypress tests
	cy.request({
		method: "PATCH",
		url: "/api/config/JSON%20API%20Token",
		dataType: "json",
		body: {
			value: "cypress_api_hack",
		},
	});

	//Don't kill pid in root for exception error handler
	cy.request({
		method: "PATCH",
		url: "/api/config/Do%20Not%20Die%20On%20Errors",
		dataType: "json",
		body: {
			value: 1,
		},
	});
	//Don't kill pid in root for exception error handler
	cy.request({
		method: "PATCH",
		url: "/api/config/Do%20Not%20Email%20On%20Errors",
		dataType: "json",
		body: {
			value: 1,
		},
	});
	return;
});

Cypress.Commands.add("sales_login", () => {
	cy.request({
		url: "/auth/login",
		method: "POST",
		form: true,
		followRedirect: false,
		body: {
			username: "Sales Guy",
			password: "password",
		},
	});

	cy.request({
		url: "/auth/eula",
		method: "POST",
		form: true,
		followRedirect: false,
		body: {
			i_agree: "1",
		},
	});

	return;
});
Cypress.Commands.add("warehouse_login", () => {
	cy.request({
		url: "/auth/login",
		method: "POST",
		form: true,
		followRedirect: false,
		body: {
			username: "",
			password: "",
		},
	});

	cy.request({
		url: "/auth/eula",
		method: "POST",
		form: true,
		followRedirect: false,
		body: {
			i_agree: "1",
		},
	});

	return;
});

Cypress.Commands.add('logout', (el) => {
	cy.visit('/auth/logout')
});
Cypress.Commands.add('exists', (el) => {
	cy.get('body').then($body => {
		var value;
		if($body.find(el).length > 0){
			value = true
		} else {
			value = false
		}
		return cy.wrap(value)
	})
});

Cypress.Commands.add('grid_empty',(array1, array2) => {
	var value;
	cy.get('.web_grid_pager').first().then(display => {
		value = 0;
		if(display.text().includes('Displaying 0 - 0 of 0')){
			value = 1;
		}
	}).then(() => {
		return cy.wrap(value, array1, array2);
	});
});

Cypress.Commands.add('text_exists', (el, text) => {
	cy.get(el).then($el => {
		var value;
		if($el.text().includes(text)){
			value = true;
		}else {
			value = false
		}
		return cy.wrap(value)
	})
})


Cypress.Commands.add("add_bill_to_lines", (length, count) => {
	function getNextElement(counter) {
		if (counter == length) {
			return;
		}

		cy.get("input[name='line_" + counter + "_shipqty']").type(counter);
		cy.get("input[name='line_" + counter + "_prcpart']").type("CMP1");
		cy.get("input[name='line_" + counter + "_cost']")
			.clear()
			.type(`${counter}.00`);
		cy.get("input[name='line_" + counter + "_resale']")
			.clear()
			.type(`${counter}.00`);

		counter++;

		getNextElement(counter);
	}
	getNextElement(count);
});



Cypress.Commands.add("creates_user", (users) => {
	var password = "password";
	cy.wrap(users).each(user => {

		cy.visit("/user/list");
		cy.get("table > tbody > tr > td > #create_user_button").click();
		cy.wrap(user).its('username').then(username => {
			cy.get('#create_user_form > div > input[name="username"]')
				.type(username)
				.should("have.value", `${username}`);
		});
		cy.get('#create_user_form > div > input[name="password"]')
			.type(password)
			.should("have.value", `${password}`);
		cy.get("#new_user_submit_botton").click();
		cy.get(
			"#cboxLoadedContent > .create_user > .column > #create_user_form > #form_error"
		).then(($error) => {
			cy.wait(1000);
			cy.wrap($error)
				.invoke("text")
				.then(($text) => {
					if (!$text) {
						cy.wrap(user).its('role').then(role => {
							cy.get('#role').select([`${role}`]);
							nav.get('body', '.button2', 'Submit')
						});
					}
					if ($text.includes("User already exists!")) {
						cy.get("#cboxClose").click();
					}
			});
		});
	});
});



Cypress.Commands.add('get_quote_po_or_order_num', (name, url, warehouse_flag) => {
	//if getting full order number (MN11.1) need warehouse flag or it will be 11.1
	if(!name){
		name = "num";
	}
	if(url){
		cy.visit(url)
	}
	cy.window().then($win => {
		cy.document().then($doc => {
			var letters = /[a-zA-Z]/gi;
			var spaces = /\s*/g;
			var title = $doc.title;
			var nums = title.replace(letters, "");
			var quote_po_or_order_num = nums.replace(spaces, "");
			if(warehouse_flag){
				cy.get('#header-location').then($this => {
					var warehouse_loc = $this.text();
					var order_num = warehouse_loc + quote_po_or_order_num;
					$win.sessionStorage.setItem(`${name}`, order_num);
				})
			}else {
				$win.sessionStorage.setItem(`${name}`, quote_po_or_order_num);
			}
		})
	})
})


//this little thing will output all of the ids of whatever element you are on into an array
//so cy.log_ids('body', 'input'); will console.log every id of every input of the body
//so you can copy paste it over into an object or an array 
Cypress.Commands.add('log_ids', function(el, el2){
	var array = [];
	cy.get(el).within(($this) => {
		cy.get(el2).each($one => {
			cy.wrap($one).invoke('attr','name').then($id => {
				if($id != undefined){
					array.push("#" + $id) 
				}
			})
		});
	});
	console.log(array)
});

// Performs an XMLHttpRequest instead of a cy.request (able to send data as FormData - multipart/form-data)
Cypress.Commands.add('form_request', (method, url, formData, done) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
        done(xhr);
    };
    xhr.onerror = function () {
        done(xhr);
    };
    xhr.send(formData);
});

Cypress.Commands.add('handle_exception', () => {
	return cy.wrap(Cypress.on('uncaught:exception', (err, runnable) => {
	// was getting errors on the labor plan page, so added this.
	// returning false here prevents Cypress from
	// failing the test
	return false
  }));
});

Cypress.Commands.add('check_bin', (warehouse, bin, qty, cost) => {
	cy.get(`[data-cy=${warehouse}]`).find(`[data-cy=${bin}-data]`).then(row => {
		if(cost){
			cy.get("input[id*='bin_cost_']").should('have.value', cost)
		}
		if(qty){
			cy.get("input[id*=bin_qty_]").should('have.value', qty)
		}
		return cy.wrap(row)
	});
});
