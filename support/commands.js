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

Cypress.Commands.add("login", () => {
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
	var user_password = { password: "password" };
	for (let user of users) {
		var username = user.username;
		var password = user_password.password;
		var role = user.role;
		cy.visit("/user/list");
		cy.get("table > tbody > tr > td > #create_user_button").click();
		cy.get('#create_user_form > div > input[name="username"]')
			.type(username)
			.should("have.value", `${username}`);
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
						cy.contains("select", `${role}`).select(`${role}`);
						cy.get(
							".box > #generic_container > .form > .form-field > .button2"
						).click();
					}
					if ($text.includes("User already exists!")) {
						cy.get("#cboxClose").click();
					}
				});
		});
	}
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

