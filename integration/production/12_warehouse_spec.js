
import General from '../../utils/general';
import Assertion from '../../utils/assertions';
import Navigation from '../../utils/navigation';
import Quotes from '../../utils/quotes';
import PO from '../../utils/pos';
import Part from '../../utils/part';

var nav = new Navigation();
var assert = new Assertion();
var quote = new Quotes();
var gen = new General();
var po = new PO();
var part = new Part();
var moment = require("moment");
var [today, futureDate] = gen.dates()
var today2 = moment().format("YYYY-MM-DD");
var rightNow = moment().format("hh-mm-ss");
var futureNow = moment().add(1, "hours").format("hh-mm-ss");
var binSuffix = moment().format("hh-mm-ss");
var ids = {
  "#ponum": ["","skip","","skip"],
  "#po_line":["CMP7","1 Part CMP7","CMP8","2 Part CMP8"],
  "#packing_slip_number":["","12345","","12345"],
  "#prcpart": ["CMP7","skip", "CMP8","skip"],
  "#cost": ["", "100","","100"],
  "#quantity": ["10", "skip","10", "skip"],
  "#location": ["MN", "skip","MN", "skip"],
  "#date_added": [today2, "skip",today, "skip"],
  "#date_code": ["",today, "", today],
  "#lot_code": ["",today,"", today],
  "#revision": ["","1", "","1"],
  "#expires_on": ["",futureDate, "",futureDate],
  "#part_desc_display": ["","skip","", "skip"],
  "#duedate_display": [today2,"skip", today2,"skip"],
  "#po_buyer_display": ["Cetec ERP Support Team","skip","Cetec ERP Support Team", "skip"],
  "#inspection_instructions": ["","skip","", "skip"],
  "#qty_accepted": ["","9","", "10"],
  "#qty_rejected": ["",'1',"",'0'],
  "textarea[name='inspection_notes']": ["", '9 have been blessed',"", '10 have been blessed'],
  "input[name='receive_notes']": ["", 'nine',"", 'ten'],
};

describe("Warehouse Tab", function() {
  beforeEach(() => {
    cy.login();
    cy.viewport(1200, 700);
  });

  it("Receives Parts with PO", function() {
    //if these are  CMP1, CMP2, CMP3, CMP4 they could accidentally affect another tests.
    part.check_initial_data_exists();
    var lines = [
      { prcpart: "CMP7", qty: "10" },
      { prcpart: "CMP8", qty: "10" }
    ];

    cy.server();
    cy
      .route("GET", "/document/object_images?object_type=Part&object_id=**")
      .as("receivingPage");
    po.create_purchaseorder(lines);
    cy.window().then($win => {
      var tab = $win.location.pathname;
      $win.sessionStorage.setItem("tab", tab);
      cy.get(".quote-header > table > tbody > tr").each(($tr, $idx) => {
        if ($idx == 1) {
          cy.get($tr).find("th").contains("P.O. Number").next().then($this => {
            var po_num = Cypress.$($this).text();
            $win.sessionStorage.setItem("po_num", po_num);
          });
        }
      });
    });
    cy
      .get("#po-lines > tbody > tr")
      .first()
      .find("a")
      .contains("Receive")
      .click();
    cy.wait("@receivingPage");
    cy.wait(5000);

    for(let i in ids["#ponum"]){
      //i == 0 & 2 is the assertion
      //i == 1 & 3 is the edit
      Object.keys(ids).forEach((id, idx) => {
        if(i == 0 || i == 2){
          if(idx == 0 || idx == 3 || idx == 5 || idx == 6 || idx == 7){
            if(idx == 0){
              cy.window().then($win => {
                cy.get(id).should('have.value', $win.sessionStorage.getItem("po_num"));
              });
            } else {
              cy.get(id).should('have.value', ids[id][i]);
            }
          } else if (idx == 4 || idx == 19){
            cy.log('Skip')
          } else {
            cy.get(id).should("contain", ids[id][i]);
          }
        } else {
          if(idx == 1 || ids[id][i] == 'skip'){
            cy.log('Skip')
          } else if(idx == 18 || idx == 19) {
            cy.get(id).type(ids[id][i]);
          } else {
            cy.get(id).clear().focus().type(ids[id][i]).blur();
          }
        }
      });
      if(i == 1 || i == 3){
        cy.get("#receive_and_clear").click();
        cy.get(".entry_success").should("be.visible");
      }
      if(i == 1){
        cy.window().then($win => {
          cy.visit($win.sessionStorage.getItem("tab"));
        });
        cy
          .get("#po-lines > tbody > tr")
          .last()
          .find("a")
          .contains("Receive")
          .click();
      }
    }
    //checks to see if they created incoming inspections
    cy.visit("/incominginspection/list");
    cy.window().then($win => {
      cy.get('input[name="ponum"]').type($win.sessionStorage.getItem("po_num"));
      nav.get("body", ".button2", "Submit");
    });
    var inspectionClasses = [
      ".Loc",
      ".Line",
      ".Prcpart",
      ".QtyInspected",
      ".QtyPassed",
      ".QtyFailed",
      ".InspectedOn",
      ".Status"
    ];
    var tr1 = ["MN", "2", "CMP8", "10", "10", "0", today, "Closed"];
    var tr2 = ["MN", "1", "CMP7", "10", "9", "1", today, "Open"];

    cy
      .get("#web_grid-incominginspectionlist > tbody > tr")
      .each(($this, $idx, $arr) => {
        cy.wrap($arr).should("have.length", "2");
        cy.get($this).within(() => {
          let count = 0;
          if ($idx == 0) {
            for (let inspection of inspectionClasses) {
              cy.get(`${inspection}`).should("contain", `${tr1[count]}`);
              count++;
            }
          } else {
            for (let inspection of inspectionClasses) {
              cy.get(`${inspection}`).should("contain", `${tr2[count]}`);
              count++;
            }
          }
        });
      });
  });

  it("Receives Parts Without PO", function() {
    //should be blank when you get there
    var assertion = "";
    var location = "MN";
    var content = [ "skip", "skip", "12345", "CMP7", "100", "7", "skip", `${today}`, `${today}`, `${today}`, 
                   "2", `${futureDate}`, "skip", "skip", "skip", "skip", "7", "0", "7 have been blessed", "seven"];
    cy.visit("/receiving/add_stock_form");
    Object.keys(ids).forEach((id, idx) => {
      if (idx == 6) {
        cy.get(id).should("have.value", location);
      } else if (idx == 7) {
        cy.get(id).should("have.value", today2);
      } else {
        cy.get(id).should("have.value", assertion);
      }
    });
    Object.keys(ids).forEach((id, idx) => {
      if (content[idx] == "skip") {
        cy.log("skip");
      } else {
        cy.get(id).clear().type(`${content[idx]}`).blur();
      }
    });
    cy.get("#receive_and_clear").click();
    cy.get(".entry_success").should("be.visible");
  });

  it("Does Several Bin Put Aways", function() {
    for (let i = 0; i < 2; i++) {
      cy.visit("/receiving/pending_receipts");
      cy.window().then($win => {
        cy
          .get("#put_away_receipts > tbody")
          .find("tr")
          .contains($win.sessionStorage.getItem("po_num") + ` - ${i + 1}`)
          .parent()
          .within($this => {
            nav.get($this, "a", "Put Away");
          });
      });
      cy.get("#qty").should("have.value", "10");
      //thought naming the bin to the time was easy to track
      //saving it so i can test it later
      cy.window().then($win => {
        if (i == 0) {
          $win.sessionStorage.setItem(`bin${i}`, rightNow);
          cy.get("#bin").clear().type($win.sessionStorage.getItem(`bin${i}`));
        } else {
          $win.sessionStorage.setItem(`bin${i}`, futureNow);
          cy.get("#bin").clear().type($win.sessionStorage.getItem(`bin${i}`));
        }
      });
      cy.get("#bin_submit").click();
      //detached from dom
      cy.window().then($win => {
        cy
          .get(".status_message")
          .should(
            "contain",
            `Put Away Into Bin ${$win.sessionStorage.getItem("bin" + i)}`
          );
        if (i == 0) {
          $win.sessionStorage.setItem(`bin${i + 1}`, futureNow);
        }
      });
      cy.visit("part/list");
      cy.get('input[name="part_search"]').clear().type(`CMP${i + 7}`);
      nav.get("body", ".button2", "Submit");
      nav.get(".Part", "a", `${i + 7}`);
      // this is kind of nasty probably need to add a class or id to the bin qty
      //checking to make sure it went into the correct bin from the putaway screen
      cy.get("#part-lines-container > .generic-header").each(($this, $idx) => {
        if ($idx == 1) {
          cy.get($this).within($div => {
            cy.get("table.web_grid > tbody > tr").each(($tr, $index) => {
              cy.window().then($win => {
                cy.wrap($tr).invoke("text").then($text => {
                  if ($text.includes($win.sessionStorage.getItem(`bin${i}`))) {
                    cy.get($tr).within($it => {
                      cy.wrap($it).should("contain", 10);
                    });
                  }
                });
              });
            });
          });
        }
      });
    }
  });

  it("Performs A Bin Merge", function() {
    cy.clearLocalStorage()
    cy.request({
      method: "PATCH",
      url: "/api/config/Prevent%20Bin%20Merge",
      dataType: "json",
      body: {
        value: 0,
      },
    });
    cy.request({
      method: "PATCH",
      url: "/api/config/Prevent%20Bin%20Merge%20-%20MN",
      dataType: "json",
      body: {
        value: 0,
      },
    });
    
    var lines = [
      { prcpart: "CMP9", qty: "10" },
      { prcpart: "CMP9", qty: "20" }
    ];
    cy.server();
    cy
      .route("GET", "/document/object_images?object_type=Part&object_id=**")
      .as("receivingPage");
    cy.route("GET", "/inv/get_bins**").as("confirm_merge");
    po.create_purchaseorder(lines);
    cy.window().then($win => {
      cy.get(".quote-header > table > tbody > tr").each(($tr, $idx) => {
        if ($idx == 1) {
          cy.get($tr).find("th").contains("P.O. Number").next().then($this => {
            var po_num = Cypress.$($this).text();
            $win.sessionStorage.setItem("po_num", po_num);
          });
        }
      });
    });
    cy
      .get("#po-lines > tbody > tr")
      .first()
      .find("a")
      .contains("Receive")
      .click();
    cy.wait("@receivingPage");
    cy.get("#qty_accepted").type(10);
    cy.get("#receive_next_line").click();
    cy.wait(2000);
    cy.get("select#po_line option").then($options => {
      Cypress.$($options).each(function() {
        if (this.value != "") {
          cy.get("select#po_line").select(`${this.value}`);
        }
      });
    });
    cy.get("#qty_accepted").type(20);
    cy.get("#receive_next_line").click();
    for (let i = 0; i < 2; i++) {
      cy.visit("/receiving/pending_receipts");
      cy.window().then($win => {
        cy
          .get("#put_away_receipts > tbody")
          .find("tr")
          .contains($win.sessionStorage.getItem("po_num") + ` - ${i + 1}`)
          .parent()
          .within($this => {
            nav.get($this, "a", "Put Away");
          });
      });
      cy.window().then($win => {
        if (i == 0) {
          $win.sessionStorage.setItem(`bin${i}`, rightNow);
          cy.get("#bin").clear().type($win.sessionStorage.getItem(`bin${i}`));
        } else {
          cy
            .get("#bin")
            .clear()
            .type($win.sessionStorage.getItem(`bin${i - 1}`));
        }
      });
      cy.get("#bin_submit").click();
      
      if (i == 1) {
        cy.wait("@confirm_merge");
        cy.get("#confirm_merge").within($this => {
          cy.get("#merge_bin").click({force: true});
        });
        cy.window().then($win => {
          cy
            .get(".status_message")
            .should(
              "contain",
              `Put Away Into Bin ${$win.sessionStorage.getItem(
                "bin" + (i - 1)
              )}`
            );
        });
        cy.visit("part/list");
        cy.get('input[name="part_search"]').clear().type(`CMP${i + 8}`);
        nav.get("body", ".button2", "Submit");
        nav.get(".Part", "a", `${i + 8}`);
        //checking to make sure it went into the correct bin from the merge screen
        cy
          .get("#part-lines-container > .generic-header")
          .each(($this, $idx) => {
            if ($idx == 1) {
              cy.get($this).within($div => {
                cy.get("table.web_grid > tbody > tr").each(($tr, $index) => {
                  cy.window().then($win => {
                    cy.wrap($tr).invoke("text").then($text => {
                      if (
                        $text.includes(
                          $win.sessionStorage.getItem(`bin${i - 1}`)
                        )
                      ) {
                        cy.get($tr).within($it => {
                          cy.wrap($it).should("contain", 30);
                        });
                      }
                    });
                  });
                });
              });
            }
          });
      }
    }
  });
  it("Multiple Bins With Suffix", function() {
    cy.clearLocalStorage();
    var lines = [{ prcpart: "CMP10", qty: "30" }];
    cy.server();
    cy
      .route("GET", "/document/object_images?object_type=Part&object_id=**")
      .as("receivingPage");
    po.create_purchaseorder(lines);
    cy.get('.quote-header > table > tbody > tr').each(($this, $idx) => {
      if($idx == 1){
        cy.get($this).within(() => {
          cy.get('td').each(($td, $i) => {
            if($i == 1){
              cy.window().then($win => {
                cy.get($td).then($its => {
                 var po_num = Cypress.$($its).text();
                 $win.sessionStorage.setItem('po_num', po_num);
                })
              })
            }
          })
        })
      }
    })
    cy.get("#po-lines > tbody > tr").find("a").contains("Receive").click();
    cy.wait("@receivingPage");
    cy.get("#qty_accepted").type(30);
    cy.get("#receive_and_clear").click();
    cy.get(".tiny-button").click();
    cy.get("tr.table_show_hide_touched").each($tr => {
      cy.window().then($win => {
        var text = $win.sessionStorage.getItem('po_num') + " - 1";
        if($tr.text().includes(text)){
          cy.get($tr).within($this => {
            cy.get($this).find('a').contains('Put Away').click()
          })
        }
      })
    })
    cy.get('#qty').clear().type(10)
    cy.get('#bin').type(binSuffix)
    cy.get('#bin_submit').click()
    cy.on('window:confirm', cy.stub());
    cy.get("tr.table_show_hide_touched").each($tr => {
      cy.window().then($win => {
        var text = $win.sessionStorage.getItem('po_num') + " - 1";
        if($tr.text().includes(text)){
          cy.get($tr).within($this => {
            cy.get($this).find('a').contains('Put Away').click()
          })
        }
      })
    })
    cy.get('#qty').clear().type(9)
    cy.get('#bin').type(binSuffix)
    cy.get('#bin_submit').click()
    cy.wait(1000)
    nav.get('#cboxLoadedContent', 'button', 'Create New');
    // cy.get('.status_message').should('contain', binSuffix + "-1");
    cy.get("tr.table_show_hide_touched").each($tr => {
      cy.window().then($win => {
        var text = $win.sessionStorage.getItem('po_num') + " - 1";
        if($tr.text().includes(text)){
          cy.get($tr).within($this => {
            cy.get($this).find('a').contains('CMP10').click()
          })
        }
      })
    })
    cy.get('#part-lines-container > div.generic-header').each(($this, $idx) => {
      if($idx == 1){
        cy.get($this).within(() => {
          cy.get('table.web_grid > tbody > tr').each($tr => {
            if($tr.text().includes(binSuffix + "-1")){
              cy.log('Bin is here');
            }
          })
        })
      }
    })
  });

  it("Creates a Warehouse User", function() {
    var warehouse_user = [{username: 'Cypress Warehouse', role: 'Warehouse'}];
    cy.creates_user(warehouse_user)
  })

  it('Moves a job to warehouse user', function() {
    var lines = [{transcode: 'build'}];
    quote.new_order(lines);
    cy.get('.status_message').should('contain', 'Success').then($text => {
      var innerText = Cypress.$($text).text();
      var regex = /[-+]?([0-9]*.[0-9]+|[0-9]+)/g;
      var nums = innerText.match(regex);
      var string = nums.toString();
      var comma = string.replace(/[a-zA-Z]/gi, "");
      var order_num = comma.replace(/\,/g, "");
      cy.window().then($win => {
        $win.sessionStorage.setItem('order_num', order_num);
      });
    });
    cy.visit('/picking/move_to_pick_queue')
    cy.window().then($win => {
        cy.get('input[name="ordernum"]').type($win.sessionStorage.getItem('order_num'))
    });
    nav.get('body', '.button2', 'Submit');
    cy.get('.move_order').click()
    cy.get('select.assign_to').select('Cypress Warehouse');
    cy.get('select[name="wo_status"]').select('Warehouse');
    cy.get('input[name="move_work_orders"]').click();
    cy.get('#show_create_customer').click()
    cy.get('#orders_grid_container > table > tbody > tr').then($tr => {
     cy.get($tr).within(() => {
       cy.get('td').each(($td, $idx) => {
         if($idx == 0){
           cy.get($td).find('a').click();
         }
       })
     })
    })
    cy.get('#pick_queue > tbody > tr').each(($tr, $idx) => {
      cy.window().then($win => {
        var order_num = $win.sessionStorage.getItem('order_num');
        if($tr.text().includes(order_num)){
          cy.log("It's here");
        }
      });
    });
    cy.visit('/user/list')
    cy.get('#userlist > table > tbody > tr').each(($tr) => {
      if($tr.text().includes('Cypress Warehouse')){
        cy.get($tr).within($this => {
          cy.get($this).find('a').contains('Impersonate').click();
        });
      }
    });
  });

  //I can't quite figure out how to do add multiple roles to one user...going to have to skip the rest of this for now.
  it('Complete Impersonated Warehouse Users Task', function(){
    cy.warehouse_login();
    cy.visit('/picking/show_pick_queue')
    cy.get('#web_grid-pickingshowpickqueue > tbody > tr').each(($tr) => {
      cy.window().then($win => {
        var order_num = $win.sessionStorage.getItem('order_num');
        if($tr.text().includes(order_num)){
              cy.log('It is there');
          // cy.get($tr).find('a').contains('Pick').click();
        }
      })
    })
  });
});
