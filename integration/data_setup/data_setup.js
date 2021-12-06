describe('Data Setup', function() {
    beforeEach(function(){
        cy.login()
    })
    it('Add Currencies', function() {
        cy.visit('/tablemaint/Currency/edit')
        cy.get('body').then(($body => {
            const currencies = ['USD', 'EUR', 'CAD']
            cy.wrap(currencies).each(curr => {
                if(!$body.find(`input[value=${curr}]`).length){
                    // create the currency
                    cy.get('.page_content > .box > #generic_container > #data_form > .button[name=add_row]').click()
                    cy.get(':nth-child(1) > .Abbrev > .textfield')
                    .click()
                    .type(curr)
                    .blur()
                    .get(':nth-child(1) > .Description > .textfield')
                    .click()
                    .type(curr)
                    cy.get('.page_content > .box > #generic_container > #data_form > #submit').click()
                }
            })
        }))
    })
    it('Add Credit Code', function() {
        cy.visit('/tablemaint/CREDC1/edit')
        cy.get('.page_content > .box > #generic_container > #data_form > .button[name=add_row]').click()
        cy.get(':nth-child(1) > .grid_col > .description')
        .click()
        .type('test_code')
        .blur()
        cy.get(':nth-child(1) > .grid_col > .credit_code')
        .click()
        // the credit code can only be one character long
        .type(9)
        cy.get('.page_content > .box > #generic_container > #data_form > #submit').click()
    })
    it('Add Cost Centers', function() {
        cy.visit('/tablemaint/CostCenter/edit')
        cy.get('body').then(($body => {
            const cost_centers = ['Headquarters', 'Sales', 'IT', 'Marketing']
            cy.wrap(cost_centers).each(cc => {
                if(!$body.find(`input[value=${cc}]`).length){
                    cy.get('.page_content > .box > #generic_container > #data_form > .button[name=add_row]').click()
                    cy.get(':nth-child(1) > .Name > .textfield')
                    .click()
                    .type(cc)
                    .blur()
                    cy.get(':nth-child(1) > .Description > .textfield')
                    .click()
                    .type(cc)
                    if(cc == 'Sales' || cc == 'IT'){
                        cy.get(':nth-child(1) > .ParentId > select').select("1")
                    }else if(cc == 'Marketing'){
                        cy.get(':nth-child(1) > .ParentId > select').select("2")
                    }
                    cy.get('.page_content > .box > #generic_container > #data_form > #submit').click()
                }else{
                    var id = $body.find(`.name[value=${cc}]`).parent('td').siblings('.Id')
                    id = id.text()
                    var parent = cy.get(`select[name=parent_id-${id}]`) 
                    if(cc == 'Sales' || cc == 'IT'){
                        parent.select("1")
                    }else if(cc == 'Marketing'){
                        parent.select("2")
                    }
                    cy.get('.page_content > .box > #generic_container > #data_form > #submit').click()
                }
            })
        }))
    })
    it('Add Tax Authority', function() {
        cy.visit('/tax/authority_list')
        cy.get('body').then($body => {
            if(!$body.find(".TaxAuthorityName:contains(10%)").length){
                cy.get('table > tbody > tr > td > #show_add_authority').click()
                cy.get('#generic_container > #new_authority_form > form > fieldset > .textfield').click()
                .type('10%')
                cy.get('#generic_container > #new_authority_form > form > fieldset > .button2').click()
                cy.get('#generic_container > .generic-header > .form > .form-field:nth-child(2) > input').click()
                .type('10%')
                cy.get('#generic_container > .generic-header > .form > .form-field > .button2').click()
            }
        })
    })
    //worry about this later
    // it('Add Tax Group', function() {
    //     cy.visit('/tax/list')
    //     cy.get('body').then($body => {
    //         if(!$body.find(".TaxGroupName:contains(10%)").length){
    //             cy.get('table > tbody > tr > td > #show_add_group').click()
    //             cy.get('#generic_container > #new_group_form > form > fieldset > .textfield').click()
    //             .type('10%')
    //             cy.get('#generic_container > #new_group_form > form > fieldset > .button2').click()
    //             cy.get('#generic_container > .generic-header > .form > .form-field > select').select('10% (10%)')
    //             cy.get('#generic_container > .generic-header > .form > .form-field > .button2').click()
    //         }
    //     })
    // })
    it('Create Vendors', function() {
        cy.visit('/vendor/list?loaded=1&reloaded=1')
        cy.get('body').then($body => {
            if(!$body.find(".VendorName:contains(Internal)").length){
                cy.get('table > tbody > tr > td > #create_button').click()
                cy.get('.site-wrapper > .page_content > .box > #generic_container > #create_vendor_fieldset').click()
                cy.get('.box > #generic_container > #create_vendor_fieldset > #create_vendor_form > #name').click()
                .type('Internal')
                cy.get('.box > #generic_container > #create_vendor_fieldset > #create_vendor_form > #create_vendor').click()
                cy.get('a:contains(Edit)').click()
                cy.get('#edit_vendor_table > tbody > tr > td > #intercompany_flag').focus()
                .select('1')
                cy.get('#edit_vendor_table > tbody > tr > td > #update_vendor').click()
                cy.get('.status_messages > .success > .close_notification > .icon > use').click()
                cy.visit('/vendor/list?loaded=1&reloaded=1')
            }
            if(!$body.find(".VendorName:contains(External)").length){
                cy.get('table > tbody > tr > td > #create_button').click()
                    .get('.site-wrapper > .page_content > .box > #generic_container > #create_vendor_fieldset').click()
                    .get('.box > #generic_container > #create_vendor_fieldset > #create_vendor_form > #name').click()
                    .type('External')
                    .get('.box > #generic_container > #create_vendor_fieldset > #create_vendor_form > #create_vendor').click()
                    .get('a:contains(Edit)').click()
                    .get('#edit_vendor_table > tbody > tr > td > #intercompany_flag').select('0')
                    .get('#remit_name').type('External Remit')
                    .get('#remit_street1').type('1234 RemitRemit')
                    .get('#remit_city').type('Austin')
                    .get('#remit_state').type('TX')
                    .get('#remit_zip').type('78744')
                    .get('#corporate_name').type('External Corporate Address')
                    .get('#corporate_street1').type('5678 CorporateCorporate')
                    .get('#corporate_city').type('Austin')
                    .get('#corporate_state').type('TX')
                    .get('#corporate_zip').type('78744')
                    .get('#vat_id').type('External VAT ID')
                    .get('textarea[name=shipping_instructions]').type('External Shipping Instructions')
                    .get('#edit_vendor_table > tbody > tr > td > #update_vendor').click()
                    .get('.status_messages > .success > .close_notification > .icon > use').click()
                    .get('.vertical_nav_notab > :nth-child(1) > a:contains(View)').click()
                    .get('#add-contact-button').click()
                    .get('input[name=firstname]').type('External Firstname')
                    .get('input[name=lastname]').type('External Lastname')
                    .get('#add-contact-submit').click()
            }
        })
    })
    it('Create Customers', function() {
        cy.visit('/customer/list?loaded=1&reloaded=1')
        cy.get('body').then($body => {
            if(!$body.find(".CustomerName:contains(TestCustomer)").length){
                cy.get('table > tbody > tr > td > #show_create_customer').click()
                .get('#coname').click()
                .type('TestCustomer')
                .get('#create_customer').click()
                .get('#credit_code').select('3 - Good')
                .get('#shipvia').select('Fedex Ground')
                .get('#business_type').select('2 - VAR')
                .get('#update_customer').click()
                .get('.vertical_nav_notab > :nth-child(1) > a:contains(View)').click()
                /*
                cy.get('#add_address_button').click()
                cy.wait(2500)
                cy.get('iframe').then($iframe => {
                    const $body = $iframe.contents().find('body')
                    cy.wrap($body).find('#street1').click().type('1234 Test Ln')
                    cy.wrap($body).find('#city').click().type('Austin')
                    cy.wrap($body).find('#state').click().type('TX')
                    cy.wrap($body).find('#country_id').select('United States ()')
                    cy.wrap($body).find('#update_address').click()
                })
                cy.get('#addresses_div > table > tbody > tr:nth-child(2) > td > .edit_address').click()
                cy.wait(2500)
                cy.get('iframe').then($iframe => {
                    const $body = $iframe.contents().find('body')
                    cy.wrap($body).find('textarea[name=shipping_instructions]').click().type('Permanent Shipping Instructions')
                    cy.wrap($body).find('#update_address').click()
                })
                */
                cy.get('#add-contact-button').click()
                .get('input[name=firstname]').type('TestCustomer Firstname')
                .get('input[name=lastname]').type('TestCustomer Lastname')
                .get('#add-contact-submit').click()
            }
        })
    })
    it('Add Shipcode', function() {
        cy.visit('/tablemaint/SHPCDE/edit')
        cy.get('tbody').then($body => {
            if(!$body.find("tbody > tr > .grid_col > .method_of_shipment:contains(Test_Shipcode)").length){
                cy.get('.button[name=add_row]').click()
                cy.get('tbody > tr:nth-child(1) > .Id')
                .then(($id) => {
                    cy.get(`tbody > tr:nth-child(1) > .grid_col > .code`)
                    .click()
                    .type($id.text())
                })
                const mos = cy.get('tbody > tr:nth-child(1) > .grid_col > .method_of_shipment')
                mos.click()
                .type('Test_Shipcode')
                .blur()
                cy.get('.page_content > .box > #generic_container > #data_form > #submit').click()
            }
        })
    })
    it('Add Ordline Status', function() {
        cy.visit('/tablemaint/OrdlineStatus/edit')
        cy.get('body').then($body => {
            if(!$body.find("tbody > tr > .grid_col > .description[value=Test_Ordline_Status]").length){
                cy.get('.button[name=add_row]').click()
                cy.get('tbody > tr:nth-child(1) > .grid_col > .description')
                .click()
                .type('Test_Ordline_Status')
                .blur()
                cy.get('tbody > tr:nth-child(1) > .grid_col > .build_order')
                .click()
                .type('1')
                .blur()
                cy.get('.page_content > .box > #generic_container > #data_form > #submit').click()
            }
        })
    })
    it('Add Build Operation', function() {
        cy.visit('/tablemaint/BuildOperation/edit')
        cy.get('body').then($body => {
            if(!$body.find("tbody > tr > .grid_col > .name[value=Test_Build_Operation]").length){
                cy.get('.button[name=add_row]').click()
                cy.get('tbody > tr:nth-child(1) > .grid_col > .name')
                .click()
                .type('Test_Build_Operation')
                .blur()
                cy.get('tbody > tr:nth-child(1) > .grid_col > .avg_seconds')
                .click()
                .clear()
                .type(60)
                cy.get('tbody > tr:nth-child(1) > .Active > select').select('Active')
                cy.get('.page_content > .box > #generic_container > #data_form > #submit').click()
            }
        })
    })
    it('Add Payment Type', function() {
        cy.visit('/tablemaint/PaymentType/edit')
        cy.get('body').then($body => {
            if(!$body.find("tbody > tr > .grid_col > .name[value=Test_Payment_Type]").length){
                cy.get('.button[name=add_row]').click()
                cy.get('tbody > tr:nth-child(1) > .grid_col > .name')
                .click()
                .type('Test_Payment_Type')
                .blur()
                cy.get('tbody > tr:nth-child(1) > .Active > select').select('Active')
                cy.get('.page_content > .box > #generic_container > #data_form > #submit').click()
            }
        })
    })
    it('Add UOMs', function() {
        cy.visit('/tablemaint/UOM/edit')
        cy.get('body').then($body => {
            if(!$body.find("tbody > tr > .grid_col > .name[value=m]").length){
                cy.get('.button[name=add_row]').click()
                cy.get('tbody > tr:nth-child(1) > .grid_col > .name')
                .click()
                .type('m')
                .blur()
                cy.get('tbody > tr:nth-child(1) > .grid_col > .description')
                .click()
                .type('meter')
                .blur()
                cy.get('.page_content > .box > #generic_container > #data_form > #submit').click()
            }
            if(!$body.find("tbody > tr > .grid_col > .name[value=cm]").length){
                cy.get('.button[name=add_row]').click()
                cy.get('tbody > tr:nth-child(1) > .grid_col > .name')
                .click()
                .type('cm')
                .blur()
                cy.get('tbody > tr:nth-child(1) > .grid_col > .description')
                .click()
                .type('centimeter')
                .blur()
                cy.get('.page_content > .box > #generic_container > #data_form > #submit').click()
            }
        })
    })
    it('Add UOM Conversions', function() {
        cy.visit('/uom/set_conversions')
        cy.get('body').then($body => {
            if(!$body.find(".web_grid > tbody > tr > :nth-child(2):contains(m, cm)").length){
                cy.get('#show_create').click()
                cy.get('select[name=uom1]').select('cm')
                cy.get('select[name=uom2]').select('m')
                cy.get('#create_uom_conversion').click()
                cy.get('input.textfield.1to2').click()
                .clear()
                .type(.01)
                cy.get('input.textfield.2to1').click()
                .clear()
                .type(100)
                cy.get('.set_uom').click()
            }
        })
    })
})

