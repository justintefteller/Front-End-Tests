import Navigation from "../utils/navigation"
var nav = new Navigation();
class Part {

    check_initial_data_exists() {
        var parts = ["CMP1", "CMP2", "CMP3", "CMP4", "CMPSerial1", "SER1"];
        cy.wrap(this.create_prc).as('create_prc');
        cy.wrap(this.create_prcpart).as('create_prcpart');

        cy.wrap(parts).each(function(part) {
            cy.request({
                method: "GET",
                url: "/api/part/" + part +"?preshared_token=cypress_api_hack",
                failOnStatusCode: false
            }).then(function(res){
                var status = res.status
               cy.wrap(status).as('status')
            }).then(function(){
                if(this.status != 200){
                    var prc = part.substring(0, 3);
                    var non_inventory = 0;
                    this.create_prc(prc);
                    if(part == "SER1"){
                        non_inventory = 1;
                    }
                    this.create_prcpart(part, '', non_inventory);
                }
            });
        });
    }

    create_initial_data = () => {
        var prcs = ["CMP", "SER", "TLA"];
        cy.wrap(prcs).each((prc) => {
            cy.create_prc(prc);
        });
        var parts = ["CMP1", "CMP2", "CMP3", "CMP4", "CMPSerial1"];
        cy.wrap(parts).each((prcpart) => {
            cy.create_prcpart(prcpart);
        });
    }
    
    create_prc = (prc) => {
        if (!prc) {
            return;
        }
    
        cy.visit("/prc/list?reloaded=1&prc=" + prc);
    
        cy.get("#web_grid-prclist").then(($a) => {
            if (!$a.text().includes(prc)) {
                cy.get(".form_table > tbody > tr > td > #show_create_prc").click();
                cy.get(
                    "#generic_container > #create_prc_form > #create_prc_fieldset > .flex_row > #prc"
                ).click();
                cy.get(
                    "#generic_container > #create_prc_form > #create_prc_fieldset > .flex_row > #prc"
                ).type(prc);
                cy.get(
                    "#generic_container > #create_prc_form > #create_prc_fieldset > .flex_row > #create_prc"
                ).click();
            }
        });
    
        it("confirm_prc_part", function () {
            cy.visit("/prc/list?reloaded=1&")
                .get(".form_table > tbody > tr > td > .tenchar")
                .click()
                .get(".form_table > tbody > tr > td > .tenchar")
                .type(prc)
                .get(".form_table > tbody > tr > td > #inspection_submit")
                .click()
                .get(
                    "#web_grid-prclist > tbody > tr > td.grid_col.PRC.edit_prc.cboxElement > a"
                )
                .should("be.visible")
                .should("have.text", prc);
        });
    
        return;
    };
    
    create_prcpart = (prcpart, bom_flag, noninventory) => {
        if (!prcpart) {
            return;
        }
        cy.visit("/part/list");
    
        var prc = prcpart.substring(0, 3);
        var part = prcpart.substring(3);
    
        cy.get("table > tbody > tr > td > .part_search")
            .click()
            .get("table > tbody > tr > td > .part_search")
            .clear()
            .type(prcpart)
            .get("table:nth-child(1) > tbody > tr > td:nth-child(2) > select")
            .select("all")
            .get("table > tbody > tr > th > .button2")
            .click();
    
        cy.get("body").then(($a) => {
            if (!$a.text().includes(prcpart)) {
                cy.get("#create_button")
                    .click()
                    .get("table > tbody > tr > td > #prc")
                    .select(prc)
                    .get("table > tbody > tr > td > #part")
                    .type(part)
                    .get("table > tbody > tr > #desc_col > .textfield")
                    .clear()
                    .type("test part " + prcpart);
                bom_flag ? cy.get("#create_as_bom").click() : cy.log("skipped");
                cy.get("table > tbody > tr > td > #create_part").click();
                if (noninventory) {
                    nav.side_menu("Edit");
                    cy.get('input[name="non_inventory"]').check();
                    cy.get("[data-cy=update_profile]").click();
                }
            }
        });
    };
    
    goto_prcpart = (prcpart) => {
        cy.get(
            ".nav-wrapper > #main_nav > .special_items > #global_search_container > #global_search"
        ).click();
        cy.get(
            ".nav-wrapper > #main_nav > .special_items > #global_search_container > #global_search"
        )
            .type(prcpart)
            .type("{enter}");
    };
    
    goto_prcpart_edit = (prcpart) => {
        cy.get(
            ".nav-wrapper > #main_nav > .special_items > #global_search_container > #global_search"
        ).click();
        cy.get(
            ".nav-wrapper > #main_nav > .special_items > #global_search_container > #global_search"
        )
            .type(prcpart)
            .type("{enter}");
        cy.get(
            ".box > .body_vertical_nav > .vertical_nav_notab > li:nth-child(2) > a"
        ).click();
    };
    
    receive_stock_without_po = (prcpart, cost, qty) => {
        cost = cost || 1;
        qty = qty || 10;
    
        cy.visit("/receiving/add_stock_form");
        cy.get("table > tbody > tr > td > #prcpart").click();
        cy.get("table > tbody > tr > td > #prcpart").type(prcpart);
        cy.get("tbody > tr > #cost_cell > #cost_info > #cost").type(cost);
        cy.get("table > tbody > tr > td > #quantity").type(qty);
        cy.get("#qty_accepted").type(qty);
        cy.get("table > tbody > .inspection > td > #receive_and_clear").click();
    };
   
    receives_stock_from_api = (prcparts, qty, location) => {
        if(!prcparts) return false;
        if(typeof(prcparts) != 'object'){prcparts = [prcparts]}
        if(!location) {location = 'MN'};
        if(!qty) {qty = 10};
        var total = qty + 1
        cy.wrap(prcparts).each((prcpart) => {
            cy.request({
            method: "POST",
            url: "/receiving/add_stock",
            form: true,
            body: {
                prcpart: prcpart,
                part_confirm: prcpart,
                qty_accepted: qty,
                qty_rejected: 1,
                quantity: total,
                location: "MN",
                },
            });
        });
    };
    create_prcpart_with_api = (token, prcpart, desc) => {
        var enc_prcpart = encodeURIComponent(prcpart)
        var enc_desc    = encodeURIComponent(desc)
        cy.request({
            method: 'PUT',
            url: `/api/part?preshared_token=${token}&prcpart=${enc_prcpart}&description=${enc_desc}`,
        });
    }
}

export default Part;
