import Navigation from "../utils/navigation";
import Assertion from "../utils/assertions";
import General from '../utils/general';
import Part from '../utils/part';

describe("The Order Entry Stock", function () {
    var nav = new Navigation();
    var assert = new Assertion();
    var gen = new General();
    var part = new Part();
    var moment = require("moment");
    //external_keys have to be unique for each iteration of an order in the api
    //time is pretty unique =)
    var external_key1 = moment().format("hh:mm:ss");
    var external_key2 = moment().add(1, "hours").format("hh:mm:ss");
    var external_key3 = moment().add(4, "hours").format("hh:mm:ss");
    var external_key4 = moment().add(5, "hours").format("hh:mm:ss");
    var [today, futureDate, tomorrow] = gen.dates()
    var week_number = moment().isoWeek().toString();
    var year_number = moment().isoWeekYear().toString();
    var year = year_number.slice(2);
    var serial = year + week_number;
    var token = "cypress_api_hack";
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
        var create_order_with_api = (external_key) => {
            return cy.request({
                method: 'POST',
                url: `/importjson/quotes?preshared_token=${token}`,
                body: {
                    "customer_id": 1, //internal
                    "internal_vendor_id_0": 1, //set's to internal order
                    "location": 'MN',
                    "external_key": external_key,
                    "place_order":true,
                    "shipto_name":"Internal Customer",
                    "billto_name":"Internal Customer",
                    "lines": [{
                        "partnum":"TLA1",
                        "transcode": "SA", //build
                        "custpart":"",
                        "qty":"10",
                        }],
                }
            });
        }
        //can call this anywhere in this file with this.create_order_with_api(external_key)
        cy.wrap(create_order_with_api).as('create_order_with_api')
    });

    //speed up
    it("Receives enough parts to make sure it doesnt run out", function () {
        part.receives_stock_from_api(["CMP1", "CMP2", "CMP3", "CMP4", "BOM1", "BOM2"], 300)
    });

    it("Creates a quote for Internal Account", () => {
        cy.server();
        cy.route("GET", "/inv/search*").as("invSearch");
        cy.route("GET", "/quote/*/get_totals").as("getTotal");
        cy.route("GET", "/quote/*/get_ecos_for_quote").as("ecos");
        cy.visit("quote/create_internal")
        cy.get("#quick_prcpart").type("TLA1");
        cy.get("#qty_1").clear().type("10");
        cy.wait("@invSearch").its("status").should("be", 200);
        cy.get("#add_newline").click().wait(2000);
        cy
            .get(".edit-row-buttons-container > .edit-line-button", {
                timeout: 20000
            })
            .first()
            .click();
        cy.get("#transcode-1").select("SA");
        cy.get(".edit-line-submit").contains("OK").first().click();
        cy.get(".vertical_nav_notab").find("a").contains("Commit").click();
        cy.wait("@ecos");
        cy.get('input[name="one_line_per_order"]').check();
        cy.get(".build_or_buy").each($one => {
            cy.get($one).select("0");
        });
        cy.get("#place-order-button").click();
        assert.success()
    });

    it("Picks Parts and Invoices All Orders", function(){
        cy.window().then($win => {
            var url = $win.location.pathname 
            $win.sessionStorage.setItem('first_order_url', url )
        });
        //goes to sub order 1
        var sub_order_nums = [ '.2', '.3', 'top order' ]
        cy.wrap(sub_order_nums).each((num, idx) => {
            if(idx != 2){
                nav.side_menu(num)
            }
            nav.side_menu('Workorder')
            nav.side_menu('Line 1')
            nav.get('body', '.button2', 'Start Work')
            cy.wait(1000)
            cy.get('#cboxLoadedContent').scrollTo('bottom')
            cy.get('#add_work_form').within($form => {
                cy.get('#add_and_close_hours:visible').type(100)
                nav.get($form, '.button2', 'Submit')
            });
            cy.wait(1000)
            cy.get('#chart').should('contain', '6,000')
            nav.side_menu('Pick Parts')
            nav.get('body', 'a', 'Pick All Lines')
            nav.get('body', '.button2', 'Update')
            cy.wait(1000)
            cy.get('span[class*="qty_picked_line_"]').each($span => {
                if(idx =! 2){
                    cy.get($span).should('contain', '100').and('have.css', 'background-color', 'rgb(0, 128, 0)')
                }else {
                    cy.get($span).should('contain', '10').and('have.css', 'background-color', 'rgb(0, 128, 0)')
                }
            })
            nav.side_menu('Complete/Receive')
            cy.get('input[id*="ship_line_"]').focus().clear().type(10).blur()
            if(idx == 2){
                cy.get('.fill_labor').check()
            }
            cy.get('#create_invoice').click()
            assert.success()
            cy.window().then($win => {
                var url =  $win.sessionStorage.getItem('first_order_url')
                cy.visit(url)
            });
        });
    });

    it('Creates An Order Without Subs', function() {
        cy.server();
        cy.route("GET", "/inv/search*").as("invSearch");
        cy.route("GET", "/quote/*/get_totals").as("getTotal");
        cy.route("GET", "/quote/*/get_ecos_for_quote").as("ecos");
        //goes straight to the build_for_stock
        cy.visit('/quote/create_internal')
        cy.get("#quick_prcpart").type("TLA1");
        cy.get("#qty_1").clear().type("10");
        cy.wait("@invSearch").its("status").should("be", 200);
        cy.get("#add_newline").click().wait(2000);
        cy
            .get(".edit-row-buttons-container > .edit-line-button", {
                timeout: 20000
            })
            .first()
            .click();
        cy.get("#transcode-1").select("SA");
        cy.get(".edit-line-submit").contains("OK").first().click();
        nav.side_menu('Commit')
        cy.wait("@ecos");
        cy.get(".build_or_buy").each($one => {
            cy.get($one).select("1").should("contain", "No");
        });
        cy.get("#place-order-button").click();
        cy.get(".status_message").should("contain", "Success");
        cy.get(".ez_current").contains("Line").click();
        cy.get(".new_part_line").each(($line, $idx, $array) => {
            var part = Cypress.$($line).attr("part");
            cy.wrap(part).should("eq", "BOM_" + ($idx + 1));
            cy.wrap($array).should("have.length", 2);
        });
        cy.get("body").find("a").contains("Pick All Lines").click();
        cy.get(".button2").contains("Update").click();
    });

    it("Dekits parts", function () {
        nav.side_menu("Dekit");
        cy.get(".new_part_line").each(($line, $idx, $arr) => {
            cy.wrap($arr).should("have.length", 2);
            cy.get($line).within($row => {
                var text = Cypress.$($row).find("a").last().text();
                var bin = text.replace(/\s*/g, "");
                if ($idx == 0) {
                    cy.get('input[type="text"]').first().type("10");
                    cy.get('input[type="text"]').last().type(bin);
                } else {
                    cy.get('input[type="text"]').first().type("5");
                    cy.get('input[type="text"]').last().type(bin);
                }
            });
        });
        cy.get(".button2").contains("Update").click();
        cy.on("window:confirm", cy.stub());
        cy.get(".new_part_line").should("contain", "5");
        nav.side_menu("Pick Parts");
        cy.get("body").find("a").contains("Pick All Lines").click();
        cy.get(".button2").contains("Update").click();
    });

    it("Edits the Temp BOM", function () {
        cy.server();
        cy
            .route("GET", "**/config/web_grid_settings?group=ordline_bom_table")
            .as("gridLoad");
        nav.side_menu("Maint/");
        nav.side_menu("BOM Management");
        cy.get("#ordline_bom_table > tbody > tr").each(($row, $idx, $arr) => {
            cy.wrap($arr).should("have.length", 7);
            if ($idx == 0 || $idx == 2) {
                cy.wrap($row).within($td => {
                    $td = "td";
                    cy.get($td).last().should("contain", "qty pulled > 0");
                });
            } else if ($idx == 1 || $idx == 3 || $idx == 5) {
                cy.log("silly invisible tr");
            } else if ($idx == 4) {
                cy.wrap($row).within(() => {
                    cy.get(".delete_comp").click();
                });
            } else {
                cy.wrap($row).within(() => {
                    cy.get('input[name="create_comp_1"]').focus().type("CMP1");
                });
            }
        });
        cy.get("#update_bom").click();
        cy.wait("@gridLoad");
        cy.get("#ordline_bom_table > tbody > tr").each(($row, $idx, $arr) => {
            if ($idx == 4) {
                cy.get($row).should("contain", "CMP1").within(() => {
                    cy.get("select").last().select("Big Saw");
                });
            }
        });
        cy.get("#update_bom").click();
    });

    it("Edits the Temp BOM Labor Plan", function () {
        var operation_instructions = [
            "Generic 1 Hour Operation",
            "(60 minutes est)"
        ];
        cy.server();
        cy.route("GET", "/otd/order/*/build_process").as("laborPlan");
        nav.side_menu("Maint/");
        nav.side_menu("Labor Plan Management");
        cy.get("#add_all_locations_button").click();
        cy.on("window:confirm", cy.stub());
        // cy.wait("@laborPlan").its("status").should("be", 200);
        cy.get("#location_table > tbody > tr").each(($row, $idx, $arr) => {
            cy.wrap($row).within(() => {
                cy.get("td").first().next().then($text => {
                    //allows us to change the default locations and still compare that it changes on the WO
                    var text = Cypress.$($text).text();
                    var nameOfLocation = text.replace(/\s*/, "");
                    var regex = /(\(Parent: Warehouse\))/g;
                    if (regex.test(nameOfLocation)) {
                        nameOfLocation = nameOfLocation.replace(regex, "");
                    }
                    //removes trailing \n
                    var removeExtras = nameOfLocation.replace(/(\r\n|\n|\r)/gm, "");
                    //removes all white space at the end of the location
                    var location = removeExtras.replace(/[ \t]+$/, "");

                    //gets the text in the row to compare it later to make sure it actually updates the labor plan on the WO
                    cy.window().then($win => {
                        $win.sessionStorage.setItem("location" + $idx, location);
                    });
                });
            });
        });
        nav.side_menu("Workorder");
        cy.get("#location_table > tbody > tr").each(($row, $idx) => {
            cy.wrap($row).then(() => {
                cy.window().then($win => {
                    //pulls each stored location out of the chrome browser stash and compares them
                    cy
                        .wrap($row)
                        .should("contain", $win.sessionStorage.getItem("location" + $idx));
                });
            });
        });
        nav.side_menu("Maint/");
        nav.side_menu("Labor Plan Management");
        cy.get(".toplevel_").then($id => {
            var location_id = $id.attr("toplevel_id");
            cy.get("#show_" + location_id).click();
            cy
                .get("select#new_operation_" + location_id)
                .select("Generic 1 Hour Operation");
            cy.get("#add_map_operation_" + location_id).click();
        });
        nav.side_menu("Workorder");

        cy.get("#location_table > tbody > tr").first().next().within(() => {
            cy.get("td").each(($one, $idx) => {
                if ($idx == 0 || $idx == 1) {
                    cy.get($one).contains(operation_instructions[$idx]);
                } else {
                    cy.log("Ain't nothing to see here folks!");
                }
            });
        });
        //delete this for next set of tests
        nav.side_menu("Maint/");
        nav.side_menu("Labor Plan Management");
        cy.get(".toplevel_").then($id => {
            var location_id = $id.attr("toplevel_id");
            cy.get("#show_" + location_id).click();
            cy.get(".delete_map_operation").first().click();
        });
        cy.get("#remove_all_locations_button").click();
    });

    //turned 400 lines into about 160 here
    //hopefully it sped it up a bit too
    it("Splits Lines and Mass Splits Lines For A Fully Picked Order", function () {
        cy.request({
            method: "PATCH",
            url: "/api/config/JSON%20API%20Token",
            dataType: "json",
            body: {
                value: token,
            },
        });
        this.create_order_with_api(external_key1).then((res) => {
            cy.wrap(res.body.orders[0]).as('order_id')
        }).then(() => {
            cy.visit(`/order/MN${this.order_id}/view`);
        })
        nav.side_menu('Workorder')
        nav.side_menu('Line 1')
        nav.side_menu("Pick Parts");
        cy.get("body").find("a").contains("Pick All Lines").click();
        cy.get(".button2").contains("Update").click();
        nav.side_menu("Maint");
        nav.side_menu("Split");
        cy.get("#qty").type(1);
        cy.get("#split_workorder_btn").click();
        cy.get("#splitworkorder").click();
        cy.window().then($win => {
            $win.sessionStorage.setItem("goback1", $win.location.pathname);
        });
        cy.get("#target > table > tbody > tr").each(($tr, $idx, $arr) => {
            cy.wrap($arr).should("have.length", 5);
            if ($idx == 0) {
                cy.wrap($tr).within($this => {
                    //captures the order number something like 7.1-1
                    cy.get($this).should("contain", `1-${$idx + 1}`);
                    cy.get($this).should("contain", "9");
                });
            } else if ($idx == 3) {
                cy.wrap($tr).within($this => {
                    //captures the order number something like 7.1-2
                    cy.get($this).should("contain", `1-${$idx - 1}`);
                    cy.get($this).should("contain", "1");
                });
            } else {
                cy.log("Useless lines");
            }
        });
        //mass split
        cy.get("#qty").type(1);
        cy.get("#mass_split_btn").click();
        nav.get('#cboxLoadedContent', '.button2', 'Yes')
        cy.wait(1000)
        cy.get("#target > table > tbody > tr").each(($tr, $idx, $arr) => {
            cy.wrap($arr).should("have.length", 21);
        });
    });

    it("Splits Lines and Mass Splits Lines For An Unpicked Order", function () {
        this.create_order_with_api(external_key2).then((res) => {
            cy.wrap(res.body.orders[0]).as('order_id')
        }).then(() => {
            cy.visit(`/order/MN${this.order_id}/view`);
        })
        nav.side_menu('Workorder')
        nav.side_menu('Line 1')
        nav.side_menu("Maint");
        nav.side_menu("Split");
        cy.get("#qty").type(1);
        cy.get("#split_workorder_btn").click();
        cy.get("#splitworkorder").click();
        cy.window().then($win => {
            $win.sessionStorage.setItem("goback2", $win.location.pathname);
        });
        cy.get("#target > table > tbody > tr").each(($tr, $idx, $arr) => {
            cy.wrap($arr).should("have.length", 5);
            if ($idx == 0) {
                cy.wrap($tr).within($this => {
                    //captures the order number something like 7.1-1
                    cy.get($this).should("contain", `1-${$idx + 1}`);
                    cy.get($this).should("contain", "9");
                });
            } else if ($idx == 3) {
                cy.wrap($tr).within($this => {
                    //captures the order number something like 7.1-2
                    cy.get($this).should("contain", `1-${$idx - 1}`);
                    cy.get($this).should("contain", "1");
                });
            } else {
                cy.log("Useless lines");
            }
        });
        //mass split
        cy.get("#qty").type(1);
        cy.get("#mass_split_btn").click();
        nav.get('#cboxLoadedContent', '.button2', 'Yes')
        cy.wait(1000)
        cy.get("#target > table > tbody > tr").each(($tr, $idx, $arr) => {
            cy.wrap($arr).should("have.length", 21);
        });
    });

    it("Tests the Batch Function", function() {
        cy.request({
            method: "PATCH",
            url: "/api/config/allow%20batch%20work%20order%20segments",
            dataType: "json",
            body: {
                value: 1,
            },
        });
        
        for (let i = 1; i < 3; i++) {
            cy.window().then($win => {
                cy.visit($win.sessionStorage.getItem(`goback${i}`));
            });
            //save order numbers to the chrome stash
            cy
                .get("#target > table > tbody > tr")
                .find("a")
                .contains(".1-1")
                .then($getText => {
                    var order_num = $getText.text();
                    cy.window().then($win => {
                        $win.sessionStorage.setItem("order" + i, order_num);
                    });
                });
        }
        //turns both work order on for the batch start time
        nav.side_menu("Workorder");

        //does this twice so that I can test delete one
        for (let i = 0; i < 2; i++) {
            cy.get("#show_time_popup").click();
            cy.window().then($win => {
                //testing to make sure it won't let you add the same order to batch
                cy
                    .get("#add_ordline_text")
                    .type($win.sessionStorage.getItem(`order2`))
                    .wait(2000)
                    .then(() => {
                        cy
                            .get(".ui-menu-item", { timeout: 10000 })
                            .contains($win.sessionStorage.getItem(`order2`))
                            .click({force:true});
                    });
                cy.get("#add_ordline").click({force:true});
                cy.get("#ordline_batch_list").find("li").should("have.length", 1);
                //weird little glitch here 2 buttons that have the same id
                cy.get("#cboxClose").click().wait(2000);
                cy.get("#show_time_popup").click();
                //now adding the real order
                cy
                    .get("#add_ordline_text")
                    .type($win.sessionStorage.getItem(`order1`))
                    .wait(2000)
                    .then(() => {
                        cy
                            .get(".ui-menu-item", { timeout: 10000 })
                            .contains($win.sessionStorage.getItem(`order1`))
                            .click();
                    });
                cy.get("#add_ordline").click();
                cy.get("#add_work_form").find("input").contains("Start Work").click();
            });
            cy.wait(5000);
            cy.get(".active_work > a").should("length.gt", 0);
            cy.get(".stop_work").click();
            // cy.wait("@loadView").its("status").should("be", 200);
            cy.get(".active_work").should("not.be", "visible");
        }

        // deletes on of the batches
        nav.side_menu("History");
        cy.get(".order_main").find("a").contains("Delete Work").click();
        cy
            .get(".order_main")
            .find("a")
            .contains("Delete Work")
            .should("have.length", 1);
    });

    it("Finds a Batch and Makes Changes", function () {
        cy.server()
        cy.route("POST", "/otd/reports/update_work_time/").as("set_work_time")
        var time = ["Hrs", "Min", "1440", "24", "$240.00"];
        nav.side_menu("Maint");
        nav.side_menu("Split");
        cy
            .get("#target > table > tbody > tr")
            .find("a")
            .contains(".1-1")
            .then($getText => {
                var order_num = $getText.text();
                cy.window().then($win => {
                    $win.sessionStorage.setItem("order", order_num);
                });
            });
        cy.visit("/otd/reports/work_list");
        cy.get(".show_grid_control").first().click();
        for (let i = 0; i < 2; i++) {
            cy
                .get("#grid_control_web_grid-otdreportsworklist > table > tbody")
                .find("tr")
                .contains(`Time Spent (${time[i]}`)
                .siblings()
                .then($radio => {
                    var radio = "input[type='radio']";
                    cy.wrap($radio).find(radio).first().click();
                });
        }
        cy.get("#cboxClose").click();
        //have to wait for it to close
        cy.wait(2000);

        //it's ugly I know but there wasn't a better way I could come up with and it's very stable
        cy.window().then($win => {
            cy
                .get("body")
                .find("a")
                .contains($win.sessionStorage.getItem("order"))
                .parent()
                .parent()
                .then($tr => {
                    cy.wrap($tr).within(() => {
                        cy.get("input[name*='start']").first().focus().clear().type(today);
                        cy
                            .get("input[name*='stop']")
                            .first()
                            .focus()
                            .clear()
                            .type(tomorrow);
                        cy.get("button").contains("Set").click();
                        //can't wait on the ajax call here for some reason
                        cy.wait(10000)
                        cy.get('td[id*="min_"]').should("contain", time[2]);
                        cy.get('td[id*="hrs_"]').should("contain", time[3]);
                        cy.get('td[id*="labor_value"]').should("contain", time[4]);
                    });
                });
        });
    });

    it("Picks Serials", function () {
        var serial_string = "YEARWEEKNUMBERSERIAL_NUM_1(4)";
        cy.server();
        cy.route("GET", "/inv/search*").as("invSearch");
        cy.route("GET", "/quote/*/get_totals").as("getTotal");
        cy.route("GET", "/quote/*/get_ecos_for_quote").as("ecos");
        cy.route("GET", "/otd/order/*/work_view").as("loadView");
        cy.visit("/config/serial_numbers");
        cy.get("#serial_format").clear().type(serial_string);
        cy.get("#update_serial").click();
        this.create_order_with_api(external_key3).then((res) => {
            cy.wrap(res.body.orders[0]).as('order_id')
        }).then(() => {
            cy.visit(`/order/MN${this.order_id}/view`);
        })
        nav.side_menu('Workorder') 
        nav.side_menu('Line 1')
        nav.side_menu("Serial");
        //makes it a bit more stable
        cy.get("#clear_all_serials").click();
        cy.get("#clear_part_sequence").click();
        cy.get(".button2").contains("Submit").click();
        cy.get("input[name*='date_code_order_']").should("have.value", serial);
        cy.get("input[name*='lot_code_order_']").clear().type(`${serial}001`);
        cy.get('input[name="num_serials"]').type(1);
        cy.get(".button2").contains("Submit").click();
        //don't know quite how to test the last number incrementing correctly
        cy
            .get("input[id*='serial_']")
            .invoke("val")
            .should("contain", year_number + week_number);
        cy.get("input[id*='sequence_']").should("have.value", "001");
    });

    it("Tests the Instructions Req'd", function () {
       this.create_order_with_api(external_key4).then((res) => {
            cy.wrap(res.body.orders[0]).as('order_id')
        }).then(() => {
            cy.visit(`/order/MN${this.order_id}/view`);
        })
        nav.side_menu("Workorder");
        nav.side_menu("Line 1")
        nav.side_menu("Maint");
        nav.side_menu("Labor Plan");
        cy.get("#add_all_locations_button").click();
        cy.on("window:confirm", cy.stub());
        cy.get(".toplevel_").then($tr => {
            var loc_id = $tr.attr("location_id");
            cy.get("#show_" + loc_id).click();
            cy
                .get("select#new_operation_" + loc_id)
                .select("Generic 1 Hour Operation");
            cy.get("#add_map_operation_" + loc_id).click();
            cy.get("textarea.expando").type("Sign me");
            cy.get('input[id*="new_required_"]').click();
            cy.get(".update_instructions").click();
        });
        cy.get('.vertical_nav_notab').find('a').contains('Workorder').click({ force: true })
        nav.side_menu("Pick Parts");
        cy.get("body").find("a").contains("Pick All Lines").click().then(() => {
            cy.get("input[name='submit']").click();
        });
        nav.side_menu("Complete");
        cy.get("#order-lines > tbody > tr").first().within($tr => {
            cy.get("input[type='number']").focus().clear().type("1").blur();
        });
        //doesn't like the popup
        cy.on("uncaught:exception", (err, runnable) => {
            return false;
        });
        for (let i = 0; i < 2; i++) {
            cy
                .get('button[id*="scaleship_line_"]')
                .contains("Yes")
                .scrollIntoView()
                .then($button => {
                    cy.wrap($button).invoke("attr", "onclick");
                });
        }
        //cant do it on visible or exists because its there just covered
        cy.wait(2000);
        //really doesn't like the popup at all
        cy.get("#create_invoice").click({ force: true });

        cy.get(".status_message").should("contain", "Error");
        cy.get('.vertical_nav_notab').find('a').contains('Workorder').click({ force: true });
        cy.get('.vertical_nav_notab').find('a').contains('Line 1').click({ force: true });

        cy.get('input[name="override_ai_requirements"]').click();

        cy
            .get('input[name="override_ai_requirements_comments"]')
            .focus()
            .type("override me");
        cy.get('input[name="override"]').click();
        nav.side_menu("Complete");
        cy.get("#create_invoice").click();
        cy.get(".status_message").should("contain", "Success");
    });
});
