import Navigation from '../utils/navigation';
import Part from '../utils/part';

describe("PQuote Test Day", function () {
  var nav = new Navigation();
  var part = new Part();
  //Login function to reset enviroment before testing
  beforeEach(function () {
    // login before each test
    cy.login();
  });
  
  it("Clears Session Storage", function () {
    cy.window().then($win => {
      $win.sessionStorage.clear();
    });
  });

  var PQuoteUrl = "";
  //it was continually making the same vendor over and over again
  //this stops that
  it("Create pquote vendor with contact", function () {
    cy.visit("/vendor/list");
    cy.get("#vendor_search").clear().type("cypress pquote vendor");
    nav.get("body", ".button2", "Submit");
    cy.get("#vendor_grid-vendorlist > tbody").then($tbody => {
      if ($tbody.find("td.VendorName").length > 0) {
        cy.get("td.VendorName").each($this => {
          cy.get($this).within($td => {
            cy.get($td).invoke("text").then($text => {
              if ($text.includes("cypress pquote vendor")) {
                cy.document().then($doc => {
                  Cypress.$($doc.body).append("<div>You found me</div>");
                });
              } else {
                cy.document().then($doc => {
                  Cypress.$($doc.body).append("<div>It is not here</div>");
                });
              }
            });
          });
        });
      } else {
        cy.document().then($doc => {
          Cypress.$($doc.body).append("<div>It is not here</div>");
        });
      }
    });
    cy.get("body").then($body => {
      if ($body.text().includes("It is not here")) {
        nav.get("#create_button");
        cy.get("#name:visible").type("cypress pquote vendor");
        cy.get("#create_vendor").click();
        cy.get("#add-contact-button").click();
        cy.get("#add-contact-form").within($this => {
          cy.get("input[name='firstname']").type("The");
          cy.get("input[name='lastname']").type("Dude");
          cy.get("#add-contact-submit").click();
        });
      } else {
        cy.log("Already here");
      }
    });
  });

  it("Create and Edit PQuote", function () {
    cy.visit("/pquote/create_pquote");

    cy
      .get(
        "#pquote-lines-container > .quote-header > #display_pquote_header > #edit-header-show > .edit-header-button"
      )
      .click();
    cy.location().then(loc => {
      PQuoteUrl = loc.pathname;
      console.log(PQuoteUrl);
    });

    cy
      .get("#vendor_search:visible", {
        timeout: 10000
      })
      .type("cypress pquote vendor");

    cy
      .get(".ui-menu-item", {
        timeout: 15000
      })
      .contains("cypress pquote vendor")
      .click();

    cy.get("#contact_id").select("The Dude");

    cy.get("table > tbody > tr > td > #moreBtn").click();

    cy
      .get("select[name=terms]>option")
      .contains("NET30")
      .first()
      .then(element =>
        cy.get("select[name=terms]:visible").select(element.val())
      );

    cy.get("#tax_search:visible").type("10");

    cy.get(".ui-menu-item:visible").contains("10 Percent Test (10%)").click();

    cy.get("input[name=update_header]").click();

    cy.window().then($win => {
      var regex = /[0-9]|[0-9][0-9]/gi;
      var url = $win.location.pathname;
      // var text = url.match(regex);
      // var string = text[0].toString();
      // var first_pq_num = string.replace(/\s*/g, "");
      $win.sessionStorage.setItem("first_pq_num", url);
    });
  });

  var prcparts = ["CMP1", "CMPSerial1", "SER1"];
  var description = ["A part", "B part", "C part"];

  it("Create or Check for Parts", function () {
    cy.visit("/part/list");
    for (let i = 0; i < prcparts.length; i++) {
      var prcs = prcparts[i].slice(0, 3);
      var parts = prcparts[i].slice(3);
      part.create_prc(prcs);
      cy.visit("/part/list");
      cy.get("button[id=create_button]").click();
      cy.get("select[id=prc]").select(`${prcs}`);
      cy.get("input[id=part]").type(`${parts}`);
      cy.get("button[id=create_part]").click();
      cy.visit("/part/list");
    }
  });

  it("Adds 3 lines to pquote", function () {
    cy.visit(PQuoteUrl); // using a global url var might be more explicit here
    for (let i = 0; i < prcparts.length; i++) {
      cy.get("#add-line-button > .add").click();
      cy.get("#seeMore").click();
      cy.get("#new_qty").type("100");
      cy.get("#new_prcpart").type(`${prcparts[i]}`);
      cy.get("#new_part_desc").type(`${description[i]}`);
      cy.get("#requested_arrival").click();
      cy.get("#promised_ship").click();
      cy
        .get("#add-line-form")
        .find("input[type=submit]")
        .contains("OK")
        .click();
    }
  });

  it("Confirm non-inventory", function () {
    cy
      .get('input[id*="custpart"][value="SER1"]:visible', {
        timeout: 10000
      })
      .last()
      .closest("tr")
      .find("a[title=Edit]")
      .click();

    cy
      .get("#edit-line-row")
      .find("input[name=no_inventory]")
      .check()
      .should("be.visible")
      .and("be.checked");

    cy.get("#edit-line-row").find("input[type=submit]").click();
  });

  it("Clone line 1", function () {
    const alert_click = cy.stub();

    const confirm_click = cy.stub();

    cy.on("window:alert", alert_click);

    cy.on("window:confirm", confirm_click);

    cy
      .get('input[id*="custpart"][value="CMP1"]:visible', {
        timeout: 10000
      })
      .first()
      .closest("tr")
      .find("td:first")
      .should("contain.text", "1");

    cy.get('a[href*="clone_line"]').first().click({
      force: true
    });

    cy
      .get('input[id*="custpart"][value="CMP1"]:visible', {
        timeout: 10000
      })
      .last()
      .closest("tr")
      .find("td:first")
      .should("not.contain.text", "1");

    cy
      .get('input[id*="custpart"][value="CMP1"]:visible')
      .last()
      .closest("tr")
      .find("a[class=delete_line]")
      .click();

    cy.on("window:confirm", confirm_click).then(() => {
      expect(alert_click).to.be.calledWith(
        "To delete this line and any others you choose, click the Delete button at the bottom right."
      );
    });
    cy.get("#delete_lines").click().then(() => {
      expect(confirm_click).to.be.calledWith(
        "Are you sure you want to delete the marked components?"
      );
    });

    nav.side_menu("Clone")

    cy.window().then($win => {
      var regex = /[0-9]|[0-9][0-9]/gi;
      var url = $win.location.pathname;
      $win.sessionStorage.setItem("cloned_pq_num", url);
    })

  });

  it("Close a pquote", function () {
    cy.window().then($win => {
      cy.visit(`${$win.sessionStorage.getItem("first_pq_num")}`);
    });
    cy.get('a[href*="reconcile"]').contains("Close").click();

    cy
      .get('input[value="Close PQuote"]:visible', {
        timeout: 10000
      })
      .click();

    cy.get("th").contains("Status").next().should("contain.text", "Closed");
  });

  it("Convert PQuote to PO", function () {

    // cy.window().then($win => {
    //   cy.visit(`${$win.sessionStorage.getItem("cloned_pq_num")}`);
    // });
    cy.visit('/vendor/list')
    cy.get('#vendor_search').type('cypress pquote vendor')
    nav.get('body','.button2', 'Submit')
    cy.get("#vendor_grid-vendorlist > tbody > tr").within($tr => {
      cy.get('.VendorNo').find('a').then($this => {
        var regex = /[0-9]|[0-9][0-9]/gi;
        var vendor_num = Cypress.$($this).text().match(regex);
        cy.window().then($win => {
          $win.sessionStorage.setItem('vendor_num', vendor_num)
        });
      });
    });
    cy.visit('/pquote/list')

    cy.window().then($win => {
      cy.get('select[name="vendor"]').select([`cypress pquote vendor (${$win.sessionStorage.getItem('vendor_num')})`])
    });

    nav.get('body', '.button2', 'Submit')

    cy.get('.PQuote').last().within($this => {
      cy.wrap($this).find('a').click()
    });

    nav.side_menu("Convert to PO");

    cy.get('input[value="Place Purchase Order"]').click();

    cy.url().should("contain", "purchaseorder");
  });

  it("Create an Orders for CMP SERIAL1", function () {
    cy.visit("/order/list");

    cy.get("#create_quote").click();

    cy.get("#customer_search").type("ABC");

    cy
      .get(".ui-menu-item:visible", {
        timeout: 10000
      })
      .contains("ABC Inc")
      .click();

    cy.get("button").contains("Create Order").click();

    cy.get("#add-line-button").click();

    cy.get("#new_prcpart").type("CMP");

    cy
      .get(".ui-menu-item:visible", {
        timeout: 10000
      })
      .contains("CMP SERIAL1")
      .click();

    cy.get("#new_custpart").type("CMPSERIAL1");

    cy.get("#wip_date").click();

    cy.get("#new_qty").clear().type("100");

    cy.get("#new_cost").clear().type("10");

    cy
      .get("#add-line-form.form:visible")
      .first()
      .find('input.button2[type="submit"][value="OK"]')
      .click();

    cy.get('a[href*="order"]').contains("Commit To Order").click();

    cy.get("#place-order-button").click();
  });

  it("Create a PQuote from a Sales Order", function () {
    nav.side_menu("Create PQuote");

    cy.get("input[type=checkbox][name=use_order_cost]:visible").check();

    cy.get("#set_all_qty_need").click();

    cy.get("#vendor_search").type("pq");

    cy
      .get(".ui-menu-item:visible", {
        timeout: 10000
      })
      .contains("cypress pquote vendor")
      .click();

    cy.get("button#add_to_pquote").click();
  });

  it("Create an Order for SER1", function () {
    cy.visit("/order/list");

    cy.get("#create_quote").click();

    // cy.get("#customer_search:visible").type("%");
    cy.get("#customer_search").type("ABC");

    cy
      .get(".ui-menu-item:visible", {
        timeout: 10000
      })
      .contains("ABC Inc")
      .click();

    cy.get("button").contains("Create Order").click();

    cy.get("#add-line-button").click();

    cy.get("#new_prcpart").type("SER1");

    cy.get("#new_custpart").type("SER1");

    cy.get("#wip_date").click();

    cy.get("#new_qty").clear().type("20");

    cy.get("#new_cost").clear().type("5");

    cy
      .get("#add-line-form.form:visible")
      .first()
      .find('input.button2[type="submit"][value="OK"]')
      .click();

    cy.get('a[href*="order"]').contains("Commit To Order").click();

    cy.get("#place-order-button").click();
  });

  it("Add Lines to an Existing PQuote from a Sales Order", function () {
    nav.side_menu("Create PQuote");

    cy
      .get('a[href*="make_pquote_from_order"]:visible')
      .contains("Create PQuote")
      .click();

    cy.get("input[type=checkbox][name=use_order_cost]:visible").check();

    cy.get("#set_all_qty_need").click();

    cy.get("#vendor_search").type("pq");

    cy
      .get(".ui-menu-item:visible", {
        timeout: 10000
      })
      .contains("cypress pquote vendor")
      .click();

    cy
      .get("select[name=add_to_pquote]>option")
      .contains("cypress pquote vendor")
      .first()
      .then(option =>
        cy.get("select[name=add_to_pquote]:visible").select(option.val())
      );

    cy.get("button#add_to_pquote").click();
    cy.get(".status_message").then($this => {
      var regex = /[0-9]|[0-9][0-9]/gi;
      var text = Cypress.$($this).text().match(regex);
      var string = text[0].toString();
      var converted_pq_num = string.replace(/\s*/g, "");
      cy.window().then($win => {
        $win.sessionStorage.setItem("converted_pq_num", converted_pq_num);
      });
    });
  });

  it("Convert Merged PQuote to PO", function () {
    cy.visit("/pquote/list");

    cy.window().then($win => {
      cy.get("#id").type(`${$win.sessionStorage.getItem("converted_pq_num")}`);
    });

    cy.get("button").contains("Submit").click();

    cy.get("td.grid_col.PQuote>a:visible").first().click();

    cy.get('a[href*="order"]').contains("Convert to PO").click();

    cy.get('input[value="Place Purchase Order"]').click();

    cy.url().should("contain", "purchaseorder");
  });
});
