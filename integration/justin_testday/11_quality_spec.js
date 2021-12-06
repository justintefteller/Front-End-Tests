import 'cypress-file-upload';
import General from '../utils/general'
import PO from '../utils/pos'
import Navigation from '../utils/navigation'
import Part from '../utils/part'
import Assertion from '../utils/assertions';
var gen = new General();
var po = new PO();
var part = new Part();
var nav = new Navigation();
var assert = new Assertion();
var moment = require("moment");
var [today, futureDate, tomorrow] = gen.dates()
var now = moment().format("hh:mm:ss");
var external_key1 = now;
var external_key2 = moment().add(1, "hours").format("hh:mm:ss");
var external_key3 = moment().add(2, "hours").format("hh:mm:ss");
var info = new Map();
var login_info = info.set('username',["Review State", "Escalation State", "MRB State", "Management State", "Closed State"]);
var token = "cypress_api_hack";
//added now so that we can create a brand new rev each time
var prcpart = "BOMQUALITYTEST" + now;
var session_storage_clear = 1;

describe("The Inventory Tab", function () {
  beforeEach(() => {
    cy.login();
    cy.viewport(1200, 700);
    if(session_storage_clear == 1){
      cy.window().then(win => {
          win.sessionStorage.clear();
      });   
    }
    var create_order_with_api = (external_key) => {
      return cy.request({
          method: 'POST',
          url: `/importjson/quotes?preshared_token=${token}`,
          body: {
              "customer_id": 2, 
              "location": 'MN',
              "po": now,
              "external_key": external_key,
              "place_order":true,
              "shipto_name":"Acme Supply",
              "shipto_address_1": "1235 Main Street",
              "shipto_address_2": "",
              "shipto_address_3": "",
              "shipto_address_4": "",
              "shipto_city": "Austin",
              "shipto_state": "TX",
              "shipto_zip": "78704",
              "billto_name": "Acme Supply",
              "billto_address_1": "1235 Main Street",
              "billto_address_2": "",
              "billto_address_3": "",
              "billto_address_4": "",
              "billto_city": "Austin",
              "billto_state": "TX",
              "billto_zip": "78704",
              "ship_via": 1,
              "lines": [{
                "partnum": prcpart,
                "transcode": "SA", //build
                "custpart": "",
                "resale": "100",
                "cost": "50",
                "qty": "10",
                "revision": "Test",
                "comments": "API Magic",
                "due_date": futureDate,
                "ship_date": futureDate,
                "wip_date": today 
            }],
          }
      });
    }
    //can call this anywhere in this file with this.create_order_with_api(external_key)
    cy.wrap(create_order_with_api).as('create_order_with_api')
  });
  
  it("Creates a specific bom for this test so it doesnt affect other tests", function () {
    cy.request({
      method: 'PUT',
      url: `/api/part?preshared_token=${token}&prcpart=${prcpart}&description=BOM%20Quality%20Test&is_bom=1`,
    });
    //for some reason the top prcpart won't create so had to do ^
    //we do this in the another test 
    cy.request({
      method: 'PUT',
      url: `/api/partrevisiondefinition?preshared_token=${token}`,
      body: {
          "prcpart": prcpart,
          "revision": {
              "part":{
                  "prcpart": prcpart,
                },
              "revision": 'Test',
              "status":"Active",
              "current_rev": true,
            },
            "bom_definition": [
            {
              "prcpart": "CMP11",
              "revision": {
                "part": {
                  "prcpart": "CMP11",
                  "description": "CMP11 test part"
                },
              },
              "component":1,
              "qty_per_top":10,
            },
            {
              "prcpart": "CMP12",
              "revision": {
                "part": {
                  "prcpart": "CMP12",
                  "description": "CMP12 test part"
                },
              },
              "component":2,
              "qty_per_top":10,
            }
          ]
        }
    });
  });

  //   cy.wrap(login_info.get('username')).each(username => {
  //     cy.request({
  //       method: 'POST',
  //       url: '/user/create',
  //       form: true,
  //       body: {
  //         username: username,
  //         password: 'password'
  //       }
  //     }).then((res) => {
  //       var url = res.body.match(/user\/\d*\/clear_email_pass/g);
  //       var id = url[0].match(/\d*/g);
  //       cy.visit(`/user/${id[5]}/edit`)
  //       cy.get("select[name='role']").select(['Admin']);
  //       nav.get('body', '.button2', 'Submit')
  //     })
  //   });
  // });

  // it("Logs An Inspection (Pass)", function () {
  //   this.create_order_with_api(external_key1).then((res) => {
  //       cy.wrap(res.body.orders[0]).as('order_id')
  //   }).then(() => {
  //       cy.visit(`/order/MN${this.order_id}/view`);
  //   })
  //   nav.side_menu("Workorder");
  //   nav.side_menu("Line 1");
  //   nav.side_menu("Inspection");
  //   cy.get("#qty_inspected").type(10);
  //   cy.get("select#inspection_type_id").select("Final");
  //   cy.get("#qty_passed").type(10);
  //   cy.get('select[name="pass_number"]').select("1st");
  //   cy.get("#qty_failed").type(0);
  //   cy.get("select#inspector_user_id").select("techx");
  //   cy.get("select#work_center").select("100 - Default");
  //   cy.get("select#location_id").select("Big Saw");
  //   cy.get('input[name="date_code"]').type(today);
  //   cy.get('input[name="inspector_text"]').type("Inspected");
  //   cy.get("#assembler").type("Justin");
  //   cy.get("#comments").type("All Good Here");
  //   cy.get("#inspection_submit").click();
  //   cy.get(".show_grid_control").first().click();
  //   //makes sure all of the columns are showing
  //   cy
  //     .get(
  //       "#cboxLoadedContent > div > table > tbody > tr > td > input[type='radio']"
  //     )
  //     .each(($this, $idx) => {
  //       if ($idx % 2 == 0) {
  //         cy.wrap($this).click();
  //       }
  //     });
  //   cy.get("#cboxClose").click();
  //   cy
  //     .get('table[id*="web_grid-otdorder"] > tbody > tr')
  //     .first()
  //     .within($this => {
  //       var classes = {
  //         ".WorkLocation" : "Big Saw",
  //         ".TLA": prcpart,
  //         ".Date": today,
  //         ".QtyInspected": 10,
  //         ".QtyAccepted": 10,
  //         ".QtyRejected": 0,
  //         ".InspectionType": "Final",
  //         ".Pass": '1',
  //         ".DateCode": today,
  //         ".Inspector": 'techx',
  //         ".InspectorText": 'Inspected',
  //         ".ProductionLine": "100",
  //         ".Assembler": "Justin",
  //         ".Comments": "All Good Here", 
  //       }
  //       Object.keys(classes).forEach(key => {
  //         cy.get(key).should('contain', classes[key])
  //       });
  //     });
  // });

  // it("Logs An Inspection (Fail)", function () {
  //   cy.server();
  //   this.create_order_with_api(external_key2).then((res) => {
  //       cy.wrap(res.body.orders[0]).as('order_id')
  //   }).then(() => {
  //       cy.visit(`/order/MN${this.order_id}/view`);
  //   })
  //   nav.side_menu("Workorder");
  //   nav.side_menu("Line 1");
  //   nav.side_menu("Inspection");
  //   cy.get("#qty_inspected").type(10);
  //   cy.get("select#inspection_type_id").select("Final");
  //   cy.get("#qty_passed").type(7);
  //   cy.get('select[name="pass_number"]').select("1st");
  //   cy.get("#qty_failed").type(3);
  //   cy.get("select#inspector_user_id").select("techx");
  //   cy.get("select#work_center").select("100 - Default");
  //   cy.get("select#location_id").select("Big Saw");
  //   cy.get('input[name="date_code"]').type(today);
  //   cy.get('input[name="inspector_text"]').type("Inspected");
  //   cy.get("#assembler").type("Justin");
  //   cy.get("#comments").type("Not Good");
  //   cy.get("#inspection_submit").click();
  //   cy.get(".generic-header > table > tbody > tr").each(($tr, $idx, $this) => {
  //     cy.wrap($this).should("have.length", 4);
  //     if ($idx != 3) {
  //       cy.wrap($tr).within($this => {
  //         cy.get(`select#failure_${$idx + 1}`).select("D01 - Incorrect BOM");
  //         cy.get(`input[name='component_number_${$idx + 1}']`).type($idx + 1);
  //         cy.get(`input[name='component_prcpart_${$idx + 1}']`).type($idx + 1);
  //         cy.get(`input[name='serial_${$idx + 1}']`).type($idx + 1);
  //         cy
  //           .get(`input[name='reference_designator_${$idx + 1}']`)
  //           .type($idx + 1);
  //       });
  //     }
  //   });
  //   cy.get("button[name='failure_submit']").click();
  //   cy.get(".status_message").should("contain", "Inspection Added");
  // });

  // it("Creates an NCR", function () {
  //   var ncr_string = "Qty Inspected: 10 Qty Failed:3";
  //   cy.window().then($win => {
  //     cy.get(".header").then($this => {
  //       var regex = /[-+]?([0-9]*.[0-9]+|[0-9]+)/g;
  //       var num = Cypress.$($this).text().match(regex);
  //       var array = [num[0], num[1]];
  //       var string = array.toString();
  //       var workorder_number = string.replace(/\,/g, "");
  //       $win.sessionStorage.setItem("workorder", workorder_number);
  //     });
  //   });
  //   cy.get("body").find("a").contains("Create NCR").click();
  //   cy.window().then($win => {
  //     cy
  //       .get(".quote-header > table > tbody")
  //       .find("td")
  //       .contains($win.sessionStorage.getItem("workorder"))
  //       .log("Right NCR");
  //   });
  //   cy.get('input[name="title"]').last().type("Leutient Dan");
  //   cy.get('select[name="prcpart"]').select([prcpart + " (BOM)"]);
  //   cy.get('input[name="quantity"]').type(3);
  //   cy.get('input[name="critical"]').click();
  //   cy.get("#vendor_search").type("Stuff And More");
  //   cy.get('input[name="po"]').type(gen.info(7));
  //   cy.get('input[name="duedate"]').type(futureDate);
  //   cy
  //     .get(".quote-header > table > tbody > tr")
  //     .last()
  //     .should("contain", ncr_string);
  //   cy.get('button[type="submit"]').contains("Update").click();
  //   cy.get(".quote-header > table > tbody > tr").first().within($this => {
  //     cy.get("td").should("contain", "CRITICAL");
  //   });
  // });

  // it("Assigns NCR to All Workflow Stages", function () {
  //   var users = [
  //     "Review State",
  //     "Escalation State",
  //     "MRB State",
  //     "Management State",
  //     "Closed State"
  //   ];
  //   var sendto = [
  //     "Send To Review",
  //     "Send To Escalation",
  //     "Send To MRB",
  //     "Go To Management",
  //     "Close"
  //   ];
  //   cy.window().then($win => {
  //     const open_tab = $win.location.pathname;
  //     $win.sessionStorage.setItem("open_tab", open_tab);
  //   });
  //   cy.get(".workflow_status").click();
  //   cy.get(".workflow_details").within($this => {
  //     cy
  //       .get($this)
  //       .find("a")
  //       .contains("Edit Workflow Assignment Options")
  //       .click();
  //   });
  //   cy.get("select#assignment_Closed").select("Closed State");
  //   // cy.get("select#assignment_Creation").select("Creation State");
  //   cy.get("select#assignment_Escalation").select("Escalation State");
  //   cy.get("select#assignment_Management").select("Management State");
  //   cy.get("select#assignment_MRB").select("MRB State");
  //   cy.get("select#assignment_Review").select("Review State");
  //   cy.get("button.button2").contains("Submit").first().click();
  //   cy.window().then($win => {
  //     cy.visit($win.sessionStorage.getItem("open_tab"));
  //   });
  //   for (let user = 0; user < users.length; user++) {
  //     // {force: true} so you don't have to close the lingering success message
  //     cy.get(".workflow_status").click({ force: true });
  //     cy.get(".workflow_details").within($this => {
  //       cy
  //         .get("select[name='assign_to" + sendto[user] + "']")
  //         .select(users[user]);
  //       cy.get("#workflow_comments").type("Review Me");
  //       cy.get($this).find("button").contains(`${sendto[user]}`).click();
  //     });
  //     cy.get(".status_message").should("contain", "Success");
  //   }
  // });

  // it("Creates a CAR from an NCR at the MRB Stage", function () {
  //   var users = ["Review State", "Escalation State", "MRB State"];
  //   var sendto = ["Send To Review", "Send To Escalation", "Send To MRB"];
  //   this.create_order_with_api(external_key3).then((res) => {
  //       cy.wrap(res.body.orders[0]).as('order_id')
  //   }).then(() => {
  //       cy.visit(`/order/MN${this.order_id}/view`);
  //   })
  //   nav.side_menu("Workorder");
  //   nav.side_menu("Line 1");
  //   nav.side_menu("Inspection");
  //   cy.get("#qty_inspected").type(10);
  //   cy.get("select#inspection_type_id").select("Final");
  //   cy.get("#qty_passed").type(7);
  //   cy.get('select[name="pass_number"]').select("1st");
  //   cy.get("#qty_failed").type(3);
  //   cy.get("select#inspector_user_id").select("techx");
  //   cy.get("select#work_center").select("100 - Default");
  //   cy.get("select#location_id").select("Big Saw");
  //   cy.get('input[name="date_code"]').type(today);
  //   cy.get('input[name="inspector_text"]').type("Inspected");
  //   cy.get("#assembler").type("Justin");
  //   cy.get("#comments").type("Not Good");
  //   cy.get("#inspection_submit").click();
  //   cy.get(".generic-header > table > tbody > tr").each(($tr, $idx, $this) => {
  //     cy.wrap($this).should("have.length", 4);
  //     if ($idx != 3) {
  //       cy.wrap($tr).within($this => {
  //         cy.get(`select#failure_${$idx + 1}`).select("D01 - Incorrect BOM");
  //         cy.get(`input[name='component_number_${$idx + 1}']`).type($idx + 1);
  //         cy.get(`input[name='component_prcpart_${$idx + 1}']`).type($idx + 1);
  //         cy.get(`input[name='serial_${$idx + 1}']`).type($idx + 1);
  //         cy
  //           .get(`input[name='reference_designator_${$idx + 1}']`)
  //           .type($idx + 1);
  //       });
  //     }
  //   });
  //   cy.get("button[name='failure_submit']").click();
  //   cy.get(".status_message").should("contain", "Inspection Added");
  //   var ncr_string = "Qty Inspected: 10 Qty Failed:3";
  //   cy.window().then($win => {
  //     cy.get(".header").then($this => {
  //       var regex = /[-+]?([0-9]*.[0-9]+|[0-9]+)/g;
  //       var num = Cypress.$($this).text().match(regex);
  //       var array = [num[0], num[1]];
  //       var string = array.toString();
  //       var workorder_number = string.replace(/\,/g, "");
  //       $win.sessionStorage.setItem("workorder", workorder_number);
  //     });
  //   });
  //   cy.get("body").find("a").contains("Create NCR").click();
  //   cy.window().then($win => {
  //     cy
  //       .get(".quote-header > table > tbody")
  //       .find("td")
  //       .contains($win.sessionStorage.getItem("workorder"))
  //       .log("Right NCR");
  //   });
  //   cy.get('input[name="title"]').last().type("Leutient Dan");
  //   cy.get('select[name="prcpart"]').select( prcpart + " (BOM)");
  //   cy.get('input[name="quantity"]').type(3);
  //   cy.get('input[name="critical"]').click();
  //   cy.get("#vendor_search").type("Stuff And More");
  //   cy.get('input[name="po"]').type(gen.info(7));
  //   cy.get('input[name="duedate"]').type(futureDate);
  //   cy
  //     .get(".quote-header > table > tbody > tr")
  //     .last()
  //     .should("contain", ncr_string);
  //   cy.get('button[type="submit"]').contains("Update").click();
  //   cy.get(".quote-header > table > tbody > tr").first().within($this => {
  //     cy.get("td").should("contain", "CRITICAL");
  //   });
  //   for (let user = 0; user < users.length; user++) {
  //     // {force: true} so you don't have to close the lingering success message
  //     cy.get(".workflow_status").click({ force: true });
  //     cy.get(".workflow_details").within($this => {
  //       cy
  //         .get("select[name='assign_to" + sendto[user] + "']")
  //         .select(users[user]);
  //       cy.get("#workflow_comments").type("Review Me");
  //       cy.get($this).find("button").contains(`${sendto[user]}`).click();
  //     });
  //     cy.get(".status_message").should("contain", "Success");
  //   }
  //   cy.get("select#car_type").select("Corrective Action");
  //   cy.get(".button2").contains("Update").click();
  // });

  // it("Edits CAR", function () {
  //   cy.get(".status_message").should("contain", "CAR Created");
  //   cy.get('select[name="type_id"]').should("have.value", "1");
  //   cy.get('select[name="source_id"]').should("have.value", "5");
  //   cy.get('select[name="prcpart"]').select(prcpart + " (BOM)");
  //   cy.get('input[name="quantity"]').clear().type(3);
  //   cy.get('input[name="title"]').last().clear().type("fix it");
  //   cy.get('input[name="duedate"]').clear().type(futureDate).blur();
  //   cy
  //     .get('textarea[name="involved_parties"]')
  //     .clear() //bypasses the lingering datefield
  //     .type("wasnt me", { force: true });
  //   cy
  //     .get('textarea[name="issue"]')
  //     .clear() //bypasses the lingering datefield
  //     .type("the continuum transfunctioner spontaneously combusted", {
  //       force: true
  //     });
  //   cy.get("body").find("button").contains("Update").first().click();
  //   cy.get("#do_create_issue").click();
  //   cy.get(".car_why").first().within(($inputs, $idx, $arr) => {
  //     cy
  //       .get('textarea[name*="why"]')
  //       .first()
  //       .clear()
  //       .type("Well what happened was..");
  //     cy.get(".button2").contains("Update").first().click();
  //     cy
  //       .get('textarea[name*="why"]')
  //       .last()
  //       .clear()
  //       .type("..I dropped the do-hicky in the thing-a-ma-jig");
  //     cy.get(".button2").contains("Update").last().click();
  //     cy
  //       .get('input[name*="new_root_cause_name_"]')
  //       .clear()
  //       .type("No or poor procedures")
  //       .wait(1000)
  //       .type("{downarrow}")
  //       .type("{enter}");
  //     cy.get(".add_root_cause").click();
  //   });
  //   cy.get(".car_why").first().within(($inputs, $idx, $arr) => {
  //     cy
  //       .get('textarea[name*="comments_root_cause_"]')
  //       .first()
  //       .type("I just kept it running");
  //   });
  //   cy.get(".button2").contains("Update").first().click();
  //   cy.window().then($win => {
  //     const tab = $win.location.pathname;
  //     $win.sessionStorage.setItem("tab", tab);
  //   });

  //   //creates a Data Maintenance CARActionType for the Car edit
  //   //had to write a little magic here to get this to work
  //   cy.visit("/tablemaint/CARActionType/edit");
  //   cy.get("body").then($body => {
  //     //check to see if there are any CARActionTypes already
  //     if ($body.find(".description").length > 0) {
  //       //if so then loop thru them
  //       cy.get(".description").each($this => {
  //         //if one of them has a value of Special Corrective Reason then I append that value as text to the dom
  //         //so that I can check for it later. You can't return a counter or break out of a loop in cypress like with sync code
  //         //also the CARActionTypes only have values and not text so search for text doesn't work until it gets appended
  //         if ($this.val() == "Special Corrective Reason") {
  //           cy.document().then($doc => {
  //             let value = Cypress.$($this).val();
  //             Cypress.$($doc.body).append(`<div>${value}</div>`);
  //           });
  //         }
  //       });
  //       //if not then create one with call Special Corrective Reason
  //       //when you click the add record, it refreshes the page and removes the appended text so that's why I added Skip This
  //     } else {
  //       nav.get($body, "button", "Add Record").then(() => {
  //         cy.document().then($doc => {
  //           Cypress.$($doc.body).append("<div>Skip This</div>");
  //         });
  //       });
  //     }
  //   });
  //   // detached from the dom
  //   cy.get("body").then($body => {
  //     if (
  //       !$body.text().includes("Special Corrective Reason") &&
  //       !$body.text().includes("Skip This")
  //     ) {
  //       nav.get($body, "button", "Add Record");
  //     }
  //   });
  //   // detached from the dom
  //   cy.get("body").then($body => {
  //     if (!$body.text().includes("Special Corrective Reason")) {
  //       cy
  //         .get('input[name*="description-"]')
  //         .first()
  //         .type("Special Corrective Reason");
  //       nav.get($body, "button", "Submit");
  //       cy.window().then($win => {
  //         cy.visit($win.sessionStorage.getItem("tab"));
  //       });
  //     } else {
  //       cy.log("Type is already there");
  //       cy.window().then($win => {
  //         cy.visit($win.sessionStorage.getItem("tab"));
  //       });
  //     }
  //   });
  //   cy.get("#type_search_new").type("Special Corrective Reason");
  //   cy
  //     .get(".ui-menu-item", {
  //       timeout: 10000
  //     })
  //     .contains("Special Corrective Reason")
  //     .click();
  //   cy.get("#name_action_new").type("New Special Corrective Action");
  //   cy.get('input[name="scope_action_new"]').each(($this, $idx) => {
  //     if ($idx == 1) {
  //       $this.click();
  //     }
  //   });
  //   cy
  //     .get("#vendor_search_new")
  //     .type("frank")
  //     .wait(1000)
  //     .type("{downarrow}")
  //     .type("{enter}");
  //   cy.get("#assigned_on_action_new").clear().type(today);
  //   cy.get("#description_action_new").clear().type("Totally finished it");
  //   cy.get("#add_action_new").click();
  //   cy.get("select#resolution_type_id").select("Completed");
  //   cy.get('textarea[name="resolution_comments"]').type("Harry Potter");
  //   cy
  //     .get("#resolution_accepted_by")
  //     .type("techx")
  //     .type("{downarrow}")
  //     .type("{enter}");
  //   cy.get(".button2").contains("Update").last().click();
  // });

  // // just a big assertion on the page
  // it("Checks CAR Info", function () {
  //   //use the index to tell which fieldset and tr it is on
  //   cy.get("fieldset").each(($this, $idx, $arr) => {
  //     cy.get($arr).should("length", 6);
  //     if ($idx == 0) {
  //       cy.get($this).within($that => {
  //         cy.get("tr").each(($tr, $index, $arr) => {
  //           if ($index == 0) {
  //             cy.get('select[name="type_id"]').invoke("val").should("be.eq", "1");
  //             cy
  //               .get('select[name="source_id"]')
  //               .invoke("val")
  //               .should("be.eq", "5");
  //           } else if ($index == 1) {
  //             cy.get('input[name="identified_on"]').should("have.value", today);
  //             cy.get($tr).should("contain", "Cetec ERP Support Team");
  //           } else if ($index == 2) {
  //             cy
  //               .get('select[name="prcpart"]')
  //               .invoke("val")
  //               .should("be.eq", prcpart);
  //             cy.get('input[name="quantity"]').should("have.value", "3");
  //           } else if ($index == 3) {
  //             cy.get('input[name="title"]').should("have.value", "fix it");
  //             cy.get('input[name="duedate"]').should("have.value", futureDate);
  //           } else if ($index == 4) {
  //             cy
  //               .get('textarea[name="involved_parties"]')
  //               .should("contain", "wasnt me");
  //             cy
  //               .get('textarea[name="issue"]')
  //               .should(
  //                 "contain",
  //                 "the continuum transfunctioner spontaneously combusted"
  //               );
  //           }
  //         });
  //       });
  //     } else if ($idx == 1) {
  //       cy
  //         .get('textarea[name*="why_"]')
  //         .first()
  //         .should("contain", "Well what happened was..");
  //       cy
  //         .get('textarea[name*="why_"]')
  //         .last()
  //         .should("contain", "..I dropped the do-hicky in the thing-a-ma-jig");
  //       cy.get($this).within($that => {
  //         cy.get("tr").each(($tr, $index) => {
  //           if ($index == 4) {
  //             cy.get($tr).should("contain", "No or poor procedures (Methods)");
  //             cy
  //               .get('textarea[name*="comments_root_cause_"]')
  //               .should("contain", " I just kept it running");
  //           }
  //         });
  //       });
  //     } else if ($idx == 2) {
  //       cy.get($this).within($that => {
  //         cy.get("tr").each(($tr, $index) => {
  //           if ($index == 2) {
  //             cy
  //               .get(".action_type")
  //               .should("have.value", "Special Corrective Reason");
  //             cy
  //               .get('input[name*="name_action_"]')
  //               .should("have.value", "New Special Corrective Action");
  //             cy.get(".vendor_search").should("have.value", "frank blanton");
  //             cy
  //               .get('input[name*="assigned_on_action_"]')
  //               .should("have.value", today);
  //           } else if ($index == 3) {
  //             cy
  //               .get('textarea[name*="description_action_"]')
  //               .should("contain", "Totally finished it");
  //           }
  //         });
  //       });
  //     } else if ($idx == 3) {
  //       cy.get($this).within($that => {
  //         cy.get("tr").each(($tr, $index) => {
  //           if ($index == 1) {
  //             cy.get("#resolution_type_id").invoke("val").should("be.eq", "1");
  //           } else if ($index == 2) {
  //             cy
  //               .get('#resolution_comments')
  //               .should("contain", "Harry Potter");
  //           } else if ($index == 3) {
  //             cy.get("#resolution_accepted_by_cont").should("contain.text", "techx");
  //           }
  //         });
  //       });
  //     }
  //   });
  // });

  // it("Deletes the Car", function () {
  //   cy.get(".button").contains("Delete CAR").click();
  //   cy.get(".status_message").should("contain", "CAR Deleted");
  // });



  it("Failed Inspections", function () {
    cy.server();
    cy.route("POST", "/receiving/add_stock").as("receiving");
    cy.route("POST", "/incominginspection/**/update").as("inspection");
    //i think the CMP3 and CMP4 price was causing the the price of the other tests to change..
    var lines = [
      { prcpart: "CMP11", qty: "10" },
      { prcpart: "CMP12", qty: "20" }
    ];
    po.create_purchaseorder(lines);
    cy.window().then($win => {
      var tab = $win.location.pathname;
      $win.sessionStorage.setItem("tab", tab);
    });
    for (let i = 0; i < 2; i++) {
      cy.get("#po-lines > tbody").within(() => {
        if (i == 0) {
          cy.get("tr").find("a").contains("Receive").first().click();
        } else {
          cy.get("tr").find("a").contains("Receive").last().click();
        }
      });
      cy.wait(2000);
      cy.get("#qty_rejected").type("10");
      cy.on("window:confirm", cy.stub());
      cy.get('textarea[name="inspection_notes"]').type("failed");
      cy.get("#receive_and_clear").click();
      cy.get('#receive_info_row').within(() => {
        cy.get(".entry_success").should("contain", "NCR");
        cy.get(".entry_success").find("a").first().click();
      });
      cy
        .get("#order-lines-container > div > table > tbody > tr")
        .each(($tr, $idx) => {
          //gets the bin info to do a vendor return
          if (i == 0) {
            if ($idx == 0) {
              cy
                .get(".page-section > table.web_grid > tbody > tr > td")
                .each(($td, $index) => {
                  if ($index == 1) {
                    cy.window().then($win => {
                      var string = $td.text();
                      var bin_info = string.replace(/\s/g, "");
                      $win.sessionStorage.setItem("bin_info", bin_info);
                    });
                  }
                });
            }
          }
          if ($idx == 5) {
            cy.get($tr).find("a").click();
          }
        });
      cy.window().then($win => {
        var tab = $win.location.pathname;
        $win.sessionStorage.setItem(`inspection${i}`, tab);
        if (i == 0) {
          cy.visit($win.sessionStorage.getItem("tab"));
        }
      });
    }
    cy.get("#qty_passed").clear().type(20);
    cy.get("#qty_failed").clear().type(0);
    cy.get('select[name="status"]').select("Closed");
    cy.get(".button2").contains("Update").click();

    //storing the po num so that I can search for it later for the closed inspection
    cy.window().then($win => {
      cy.get(".vertical_nav_notab").find("a").contains("PO").then($this => {
        var regex = /[-+]?([0-9]*.[0-9]+|[0-9]+)/g;
        var arr = Cypress.$($this).text().match(regex);
        var remove_space = arr[0].toString();
        var num = remove_space.replace(/' '/g, "");
        var po_num = Number(num);
        $win.sessionStorage.setItem("po_num", po_num);
      });
    });
    cy
      .get(".subnav_link")
      .contains("Incoming Inspections")
      .click({ force: true });
    nav.get("body", ".button2", "Submit");
    cy.reload();
    cy.window().then($win => {
      cy.get('input[name="ponum"]').type($win.sessionStorage.getItem("po_num"));
    });
    cy.get("#status").select("Closed");
    nav.get("body", ".button2", "Submit");
    cy.get("#web_grid-incominginspectionlist > tbody > tr").each($tr => {
      if ($tr.text().includes("Closed")) {
        cy.get($tr).within($this => {
          cy.get(".Inspection").find("a").invoke("attr", "href").then($url => {
            cy.visit($url);
          });
        });
      }
    });
    cy.get('select[name="status"]').select("Open");
    nav.get("body", ".button2", "Update");
    cy.get("#qty_passed").clear().type(19);
    cy.get("#qty_failed").clear().type(1);
    nav.get("body", ".button2", "Update");
    cy.get("body").find("a").contains("NCR");

    cy.window().then($win => {
      cy.visit($win.sessionStorage.getItem("inspection0"));
    });
    cy.get('input[name="trackingnum"]').type(gen.info(7));
    cy
      .get('textarea[name="resolution_comments"]')
      .clear()
      .type("dont want it anymore");
    cy.get('input[name="returned_on"]').clear().type(futureDate);
    nav.get("body", "a", "Return To Vendor");
    cy.get("#vendor_search").type("House Of Stuff");
    cy
      .get(".ui-menu-item", { timeout: 10000 })
      .contains("House Of Stuff")
      .then($this => {
        $this.click();
      });
    cy.window().then($win => {
      var text = $win.sessionStorage.getItem("bin_info");
      cy.log(text);
      cy.get(".web_grid > tbody > tr").each($tr => {
        if ($tr.text().includes(`${text}`)) {
          cy.get($tr).within($this => {
            cy.get(".return_qty").type(10);
          });
        }
      });
    });

    cy.get("#create_vendor_return").click();
  });

  it("Preforms a Vendor Return", function () {
    cy.get("#order-lines > tbody").should("contain", "CMP11");
    cy.get("input[name*='return_qty_']").invoke("val").should("be.eq", "10");
    cy.get('input[name="description"]').clear().type("Bye");
    cy.get('textarea[name="comments"]').clear().type("See ya");
    cy.get("#create_debit_memo").click();
    cy.wait(2000);
    cy.get(".status_message").should("contain", "Debit Memo Created");
    cy.on("window:confirm", cy.stub());
    cy.get("#return").click();
    cy.get(".status_message").should("contain", "Vendor Return Closed");
  });

  //The next set of tests are for ncrs
  var ncr_car_prcpart  = 'PRTNCRANDCARTEST';
  var desc = 'ncr and car test';
  const input_names = 
      {
          ncr: {
              skip : [
                  "textfield","transition","update_workflow_assignment",
                  "workflow_comments","workflow_cc_list","update_workflow_cc_list",
                  "update_workflow_priority","new_order_line","customer_id","po", "picture"
                  ],
              select: {
                  "ncr_type": ['Customer Complaint (External)'],
                  "department": ['At Vendor Outsourcing']
              },
              type: {
                  "title":"NCR Test",
                  "customer_name":'ABC Inc.',
                  "prcpart":ncr_car_prcpart,
                  "vendor":'Stuff And More',
                  "duedate": tomorrow,
                  "quantity":1,
              },
              check: {
                  "critical":'check'
              },
              iframe: 'Testing the NCR'
          }
      }
    it("Creates a NCR and CAR from scratch", function () {
      session_storage_clear = 0;
      var links = ["ncr", "car"];
      for (let i = 0; i < links.length; i++) {
        cy.visit(`/otd/${links[i]}/list`);
        nav.get("body", ".button", "Create");
        cy.get(`#${links[i]}_creation:visible`).within($this => {
          nav.get($this, ".button2", "Create");
        });
        cy.get(".status_message").should("contain", `${links[i].toUpperCase()} Created`);
        cy.window().then($win => {
          $win.sessionStorage.setItem(`${links[i]}_link`, $win.location.pathname);
        })
      }
    });

    it("Creates a specific part for this test", function() {
        part.create_prcpart_with_api(token, ncr_car_prcpart, desc)
        part.receives_stock_from_api(ncr_car_prcpart)
    });

    it('Checks rendering', function(){
        cy.window().then($win => {
            cy.visit($win.sessionStorage.getItem('ncr_link'))
        });
        cy.wrap(input_names.ncr.skip).each((input, idx) => {
            cy.wrap(`input[name="${input}"]`).should('exist')
        });
        Object.keys(input_names.ncr.select).forEach(select => {
            cy.wrap(`select[name="${select}"]`).should('exist')
        });
        Object.keys(input_names.ncr.type).forEach(type => {
            cy.wrap(`input[name="${type}"]`).should('exist')
        });
        Object.keys(input_names.ncr.check).forEach(check => {
            cy.wrap(`input[name="${check}"]`).should('exist')
        });
        cy.get('.jHtmlArea').each(function (area){
            cy.wrap(area).should('exist')
        });
    });

    it('Updates NCR', function(){
        Object.keys(input_names.ncr.type).forEach(key => {
            if(key == 'customer_name'){
                cy.get(`input[name="${key}"]`).type(input_names.ncr.type[key])
                nav.get_dropdown(input_names.ncr.type[key])
            } else {
                cy.get(`input[name="${key}"]`).last().focus().clear().type(input_names.ncr.type[key]).blur()
            }
        });
        Object.keys(input_names.ncr.select).forEach(key => {
            cy.get(`select[name="${key}"]`).select(input_names.ncr.select[key])
        });

        Object.keys(input_names.ncr.check).forEach(key => {
            cy.get(`input[name="${key}"]`).check()
        });
        //this doesn't work.. boo
        // cy.get('iframe').each(frame => {
        //    cy.wrap(frame).click().type(input_names.ncr.iframe)
        // });
    });

    it('Uploads a photo', function(){
        cy.fixture('assets/upload_photo.jpg').then(fileContent => {
            cy.get('input[type="file"]').attachFile({
                fileContent: fileContent.toString(),
                fileName: 'assets/upload_photo.jpg',
                mimeType: 'image/jpg'
            });
        });
        nav.get('body', '.button2', 'Update')
        cy.get('.image_popup_link').should('have.length', 1)
    });

    it("Makes Sure Update Committed", function(){
        cy.get('body').find('td').contains('CRITICAL').should('have.css', 'background-color','rgb(255, 0, 0)')
        cy.get('select[name="ncr_type"]').should('have.value', 3)
        Object.keys(input_names.ncr.type).forEach(type => {
            cy.get(`input[name="${type}"]`).last().should('have.value', input_names.ncr.type[type])
        });
        Object.keys(input_names.ncr.check).forEach(check => {
            cy.get(`input[name="${check}"]`).should('be.checked')
        });
    });

    const print_assert = [
        ["For Customer " + input_names.ncr.type.customer_name],
        ["NCR Type:","Customer Complaint",	"Initiated By:","techx", today],
        ["Order/Line:",	"Prcpart:",ncr_car_prcpart, `(Qty: ${input_names.ncr.type.quantity})`],
        ["Assigned To:", "techx"],
        ["Source:",	"Independent", "Vendor:", input_names.ncr.type.vendor],
        ["Details"],
        ["Non-Conformance Details"],
        ["Containment"],
    ];

    it('Checks Printable', function(){
        cy.window().then($win => {
            var url = $win.sessionStorage.getItem('ncr_link');
            var new_url = url.replace(/edit/,'print');
            cy.visit(new_url)
        });
        cy.get('table').last().within((table) => {
            cy.get('tr').each((tr, idx) => {
                cy.wrap(print_assert[idx]).each(assert => {
                    cy.wrap(tr).should('contain',assert)
                });
            });
        });
    });
    it('Checks PDF', function(){
        cy.window().then($win => {
            var url = $win.sessionStorage.getItem('ncr_link');
            var new_url = url.replace(/edit/,'pdf');
            cy.visit(new_url)
        });
        cy.get('table').last().within((table) => {
            cy.get('tr').each((tr, idx) => {
                cy.wrap(print_assert[idx]).each(assert => {
                    cy.wrap(tr).should('contain',assert)
                });
            });
        });
    });

    it('Deletes the NCR', function(){
        cy.window().then($win => {
            var url = $win.sessionStorage.getItem('ncr_link');
            cy.visit(url)
        });
        nav.get('body','.button', 'Delete')
        cy.get('.status_message').should('contain', 'Deleted')
        
    })
});
