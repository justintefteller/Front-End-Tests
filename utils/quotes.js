import Navigation from './navigation'
import Assertion from './assertions'
import General from './general'
var nav = new Navigation();
var gen = new General();
var assert = new Assertion();
var [today, future] =  gen.dates()

class Quotes {

    fill_required_header_info(cust){
        if(!cust) {
            cy.log("need a cust");
            return false;
        }
        var info = gen.info(7);
        var input = {
            "#custponum"      : info, 
            "#carrier_account": 12345,
        }
        var select = {
            "#header_shipvia"          : ['UPS Ground'],
            "select[name='ship_type']" : ["P"],
            "select[name='order_type']": ["U"]
        }
        var select_assert = {
            "#header_shipvia"          : '1',
            "select[name='ship_type']" : "P",
            "select[name='order_type']": "U"
        }
        var textareas = {
            "textarea[name='shipping_instructions']": 'Shipping Comments Go Here',
            "textarea[name='customer_rfq_comments']": 'Customer Detailed Comments Go Here',
            "textarea[name='export_comments']"      : 'External Comments Go Here',
            "textarea[name='internal_comments']"    : 'Internal Comments Go Here',
        }
        var asserts = [input, select_assert, textareas]

        //Fill in info
        nav.get('.edit-header-button');
        nav.get('#seeMore');
        cy.get("#customer_search").type(cust);
        nav.get_dropdown(cust)
        cy.get('#shipto_update_container').should('be.visible')
        nav.do_inputs(select, input, textareas);
        nav.get('#update_header_button')

        //Assertion
        nav.get('.edit-header-button');
        nav.get('#seeMore');
        asserts.forEach((type) => {
            Object.keys(type).forEach((key) => {
                cy.get(key).should('have.value', type[key]);
            })
        });
        nav.get('#update_header_button')
    }

    fill_first_line(prcpart, qty, resale, cost){
        if(!prcpart || !qty) {
            cy.log("need a prcpart and qty");
            return false
        }
        cy.server()
        // cy.route('GET', '/quote/*/get_totals').as('getTotal')
        cy.route('GET', '/inv/search*').as('invSearch')
        //sometimes the resale isn't visible
        cy.get('.kinda_show_grid_control').click()
        cy.get("#show_heading_control_16").click()
        cy.get('#cboxClose').click()
        cy.wait(1000)
        cy.get('#quick_prcpart:visible').type(prcpart)
        cy.get('#promise_date_1').type(today)
        cy.wait('@invSearch').its('status').should('eq', 200)
        cy.get('#qty_1').clear().type(qty)
        cy.get('#qty_1').focus().clear().type(qty).blur()
        cy.wait('@invSearch').its('status').should('eq', 200)
        if(cost){
            cy.get('#cost_1').scrollIntoView().then($cost => {
                cy.wrap($cost).wait(2000).clear().type(' ')
                cy.wrap($cost).wait(2000).clear().type(cost)
            });
            cy.wait('@invSearch').its('status').should('eq', 200)
        }
        if(resale){
            cy.get('#resale_1').scrollIntoView().clear({force:true}).type(resale, {force: true})
            cy.get('#add_newline').click()
            cy.wait(5000)
            // cy.wait('@getTotal').its('status').should('eq', 200)
        }
        cy.get('#promise_date_1').should('have.value', `${today}`)
        cy.get('#due_date_1').should('have.value', `${today}`)
        cy.get('#qty_1').should('have.value', '10')
        if(cost){
            cy.get('#cost_1').should('have.value', `$${cost}.00`)
        }
        if(resale){
            cy.get('#resale_1').should('have.value', `$${resale}.00`)
        }
    }
    //single line
    create_order_from_quote(cust, prcpart, qty, resale, cost){
        var ext_cost;
        var ext_resale;
        var cost_value;
        var resale_value;
        var prc = prcpart.substring( 0, 4)
        var part = prcpart.substring(4)
        var asserts = [prc, part, qty]

        if(cost){
            ext_cost = cost * qty
            cost_value = gen.formatMoney(cost, "$")
            asserts.push(gen.formatMoney(ext_cost, "$"))
        }
        if(resale){
            ext_resale = resale * qty
            resale_value =  gen.formatMoney(resale, "$")
            asserts.push(gen.formatMoney(ext_resale, "$"))
        }
        cy.visit('/quote/create_quote')
        this.fill_required_header_info(cust);
        this.fill_first_line(prcpart, qty, resale, cost);
        nav.side_menu('Commit')

        //Assert Values
        cy.get('#quote-lines').within(() => {
            cy.get('tbody > tr').first().then(($this) => {
                cy.wrap(asserts).each(assertion => {
                    cy.get($this).should('contain', assertion)
                })
            })
            if(cost){
                cy.get('#cost_1').should('have.value', cost_value)
            }
            if(resale){
                cy.get('#resale_1').should('have.value', resale_value)
                cy.get('#total_resale').should('contain', gen.formatMoney(ext_resale, '$'))
            }
        })
        nav.get('body', '.button2', 'Commit Order');
        assert.success();
        
    }

    //This one is the fastest just the most limited and complicated 
    //only use if you don't need to test the order but need an order to proceed.
    create_internal_order_with_api(token, external_key, partnum, transcode, qty){
        return cy.request({
            method: 'POST',
            url: `/importjson/quotes?preshared_token=${token}`,
            body: {
                "customer_id": 1, //internal
                "internal_vendor_id_0": 1,
                "location": 'MN',
                "external_key": external_key,
                "place_order":true,
                "shipto_name":"Internal Customer",
                "billto_name":"Internal Customer",
                "lines": [{
                    "partnum": partnum,
                    "transcode": transcode,
                    "qty":qty,
                    }],
            }
        });
    }

    //This one is the fastest just the most limited and complicated 
    //only use if you don't need to test the order but need an order to proceed.
    create_order_with_api = (token, external_key, prcpart, transcode, date1, date2, resale, cost, qty) => {
        if(!token) return false;
        if(!external_key) return false;
        if(!prcpart) return false;
        if(!transcode) {transcode = "SA"};
        if(!date1){date1 = today}
        if(!date2){date2 = future}
        if(!resale){resale = '100'}
        if(!cost){cost = '50'}
        if(!qty){qty = '10'}
        var info = gen.info(10)
        return cy.request({
            method: 'POST',
            url: `/importjson/quotes?preshared_token=${token}`,
            body: {
                "customer_id": 2, 
                "location": 'MN',
                "po": info,
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
                    "transcode": transcode, //build
                    "custpart": "",
                    "resale": resale,
                    "cost": cost,
                    "qty": qty,
                    //   "revision": "Test",
                    "comments": "API Magic",
                    "due_date": date2,
                    "ship_date": date2,
                    "wip_date": date1 
              }],
            }
        });
      } 

    //you can add as many prcparts/lines as you want for this quote/order
    //this is the slowest
    //multiline
    new_order = (lines, drop_ship, build_or_buy, internal) => {
        Cypress.config('pageLoadTimeout', 120000)
        cy.server();
        cy.route("GET", "/inv/search*").as("invSearch");
        // cy.route("GET", "/quote/*/get_totals").as("getTotal");
        cy.route("POST", "/quote/*/ajax_create_line").as("create_line");
        cy.route("POST", "/quote/*/create_line").as("add_button_create_line");
        cy.route("GET", "/quote/*/get_ecos_for_quote").as("ecos");
        cy.route("GET", "/quote/*/line/*").as("lineUpdate");
        cy.route("GET", "/part/search?by=term&term=*").as("part_lookup");
        if(internal){
            cy.visit("/quote/create_internal");
        }else{
            cy.visit("/quote/list");
            cy.get(".button").contains("Create").then(($button) => {
                    cy.wrap($button).click();
                });
            cy.get(".edit-header-button").click();
            cy.get("#customer_search").focus().type(" ");
            cy.get(".ui-menu-item", {timeout: 10000,}).contains("ABC Inc.").click();
            cy.get("#custponum").type(gen.info(6));
            cy.get("#header_shipvia").select(["Fedex Ground"]);
            cy.get("#shipto_update_container").should("be.visible");
            drop_ship ? cy.get('select[name="order_type"]').select('D') : cy.log('No Drop Ship');
            cy.get("#update_header_button").click();
        }
        lines.forEach((line, i) => {
            if (!line.prcpart) line.prcpart = "BOM1";
            if (!line.qty) line.qty = "10";
            if (!line.resale) line.resale = "100";
            if (!line.cost) line.cost = "10";
            if (!line.transcode) line.transcode = "SA";
            if (
                line.transcode.toUpperCase() == "CHARGE" ||
                line.transcode.toUpperCase() == "NN"
            ) {
                line.transcode = "NN";
            } else if (
                line.transcode.toUpperCase() == "SN" ||
                line.transcode.toUpperCase() == "STOCK" 
            ) {
                line.transcode = "SN";
            } else if (
                line.transcode.toUpperCase() == "BUILD" ||
                line.transcode.toUpperCase() == "SA"
            ) {
                line.transcode = "SA";
            } else {
                line.transcode = "SA";
            }
            if(!line.use_add_line_button){
                cy.get("#quick_prcpart").type(line.prcpart);
                cy.get(`#qty_${i + 1}`).focus().clear().type(line.qty).blur();
                cy.wait("@invSearch").its("status").should("eq", 200);
                cy.get(".kinda_show_grid_control").click().wait(1000);
                cy.get("#web_grid_control_quote-lines > tbody")
                    .find("tr")
                    .contains("Resale")
                    .siblings()
                    .then(($radio) => {
                        var radio = "input[type='radio']";
                        cy.wrap($radio).find(radio).first().click();
                    });
                cy.get("#cboxClose").click();
                cy.get(`#resale_${i + 1}`).clear().type(line.resale);
                cy.get(`#cost_${i + 1}`).wait(1000).clear().type(line.cost);
                cy.get("#add_newline").click();
                cy.wait("@create_line");
                cy.wait("@lineUpdate").its("status").should("eq", 200);
                // cy.wait("@getTotal").its("status").should("eq", 200);
                cy.wait(5000);
                cy.get("#quote-lines > tbody > tr > td.drag-handle")
                    .contains(`${i + 1}`)
                    .parent()
                    .within(($this) => {
                        var line_id = $this.attr("line_id");
                        cy.get(`#buttons_for_${line_id} > .edit-row-buttons-container > .edit-line-button`).scrollIntoView().first().click();
                    });
                // cy.get(".edit-row-buttons-container > .edit-line-button").first().click();
                cy.get(`#transcode-${i + 1}`).select(line.transcode);
                cy.get(".edit-line-submit").contains("OK").first().click();
            }else{
                //using the add line button I believe is quicker but has less options
                cy.get('#add-line-button').first().click()
                cy.get('fieldset.quote_line_edit').within($this => {
                    cy.get('#new_prcpart').first().type(line.prcpart)
                });
                //so this is in a javascript tag
                nav.get_dropdown(line.prcpart)
                //that is outside of the scope of the fieldset
                //so you can't look for it while inside of the within loop
                cy.get('fieldset.quote_line_edit').within($this => {
                    cy.wait('@invSearch').its('status').should('eq', 200)
                    cy.get('#new_qty').first().clear().type(line.qty)
                    cy.get('#new_cost').first().clear().type(line.cost)
                    cy.get('#new_resale').first().clear().type(line.resale)
                    cy.get('#new_transcode_').first().select(line.transcode)
                    cy.get('.button2').first().click()
                });
            }
        });
        cy.get(".vertical_nav_notab").find("a").contains("Commit").click();
        cy.wait("@ecos");
        cy.reload();
        if(drop_ship){
            cy.get('.internal_vendor_search').type('More')
            nav.get_dropdown('More')
        }
        var alert_string = 'One or more BOM Worksheets are still loading. Please wait, reload this screen, and try again';
        const quote_err_handling = () => {
            assert.exists('#order_alerts_and_extras').then(res => {
                if(res == true){
                    assert.text_exists('#order_alerts_and_extras', alert_string).then((res2) => {
                        if(res2 == true){
                            cy.reload();
                            quote_err_handling();
                        }
                    });
                }
            })
        }
        //litte recursive action here
        quote_err_handling();
        if(build_or_buy.toUpperCase() == "YES"){
            cy.get('.build_or_buy').each(one => {
                cy.wrap(one).select(['Yes'])
            });
        }else if (build_or_buy.toUpperCase() == "WITH TOP"){
            cy.get('.build_or_buy').each(one => {
                cy.wrap(one).select(['With Top'])
            });
        }
        cy.get("#place-order-button").click();
        cy.get(".status_message").contains("Created Order");
    }
    
}

export default Quotes;
