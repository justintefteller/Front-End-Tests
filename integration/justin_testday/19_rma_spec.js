import 'cypress-file-upload';
import Part from '../utils/part';
import Quote from '../utils/quotes';
import General from '../utils/general';
import Assertion from '../utils/assertions';
import Navigation from '../utils/navigation';

describe('RMA', function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
        function create_invoice (external_key, transcode){
            quote.create_order_with_api( token, external_key, 'BOM2', transcode, today, future ).then(res => {
                var order = "MN" + res.body.orders[0];
                cy.wrap(order).as('order')
            }).then(function(){
                cy.visit(`order/${this.order}/view`)
            });
            nav.side_menu('Workorder')
            nav.side_menu('Line 1')
            nav.side_menu('Pick Parts')
            nav.get('body', 'a', 'Pick All Lines')
            nav.get('body', '.button2', 'Update')
            nav.side_menu('Invoice')
            cy.get('input[type="number"').clear().type('10')
            nav.get('body', '.button', 'Create Invoice')
            assert.success()
        }

        cy.wrap(create_invoice).as('create_invoice');
       
    });

    var part  = new Part();
    var quote = new Quote();
    var assert= new Assertion();
    var gen   = new General();
    var nav   = new Navigation();
    var [today, future, tomorrow] = gen.dates();
    var moment = require("moment");
    var now   = moment().format("hh:mm:ss");
    var now2  = moment().add( 1, 'minutes').format("hh:mm:ss")
    var token = 'cypress_api_hack';
    var external_key = now;
    var external_key2 = now2;
    var objs = {
        'build': [external_key, 'SA'],
        'stock': [external_key2, 'SN'],
    }

    for(let key in objs) {
        dynamic_rma_test(objs[key][0], objs[key][1], key)
    }
    function dynamic_rma_test (external_key, transcode, type){

        it('Creates RMA from Existing Invoice', function() {
            part.receives_stock_from_api(['BOM2','CMP3', 'CMP4'], 201);
            
            this.create_invoice(external_key, transcode)
            nav.side_menu('Create RMA')
            assert.success("RMA Created")
        });

        it("Checks the RMA Edit Screen", function(){
            cy.window().then(win => {
                win.sessionStorage.setItem('rma', win.location.pathname);
            });
            var select_ids = {
                '#rma_type_id':[["Customer Service"], 2],
                '#rma_reason_code_id':[['Damaged Product'], 1],
                "#rma_status_code_id":[['Repair'], 1],
            };
            //header
            cy.get('#quote_restrictions').within(() => {
                cy.get('tr').first().within(($tr) => {
                    cy.get('#customer_search').should('have.value', 'ABC Inc.')
                    cy.get('input[name="active"]').should('be.checked')
                    cy.wrap($tr).should('contain', "Cetec")
                    cy.get($tr).siblings().first().should('contain', "MN");
                });
                Object.keys(select_ids).forEach(key => {
                    cy.get(key).select(select_ids[key][0]);
                });

                cy.get('textarea[name="reason_description"]').clear().type('Well we messed up.');
            });

            nav.get('body','.button2','Update')

            //asserts header update
            Object.keys(select_ids).forEach(key => {
                cy.get(key).should('have.value', select_ids[key][1]);
            });
            cy.get('textarea[name="reason_description"]').should('have.text','Well we messed up.');

            //footer
            var asserts = ['BOM2', '$100.00', '10'];
            cy.get('#quote-lines').within(() => {
                cy.get('tbody > tr').first().then($tr => {
                    cy.wrap(asserts).each(one => {
                        cy.get($tr).should('contain', one);
                        cy.log(one + ' is there.');
                    });
                });
            })

            cy.get('.rma_qty').clear().type(5);
            nav.get('body','.button2','Update');

        });

        var row_asserts = ['BOM2', '5'];
        it('Does the create Receiving PO', function(){
            var reloadFunc = function () {
                cy.reload();
                nav.side_menu('PO')
            }
            cy.server();
            cy.route('POST', '/rma/*/update').as('rma_update');
            cy.window().then(win => {
                cy.visit(win.sessionStorage.getItem('rma'));
            });
            nav.get('body', 'button', 'Create Receiving PO');
            cy.on('window:confirm', cy.stub());
            cy.wait('@rma_update')
            //this might backfire on me later..
            cy.get('.vertical_nav_notab').within(($this) => {
                cy.get('li').last().then(li => {
                    assert.text_exists(li, 'PO').then(res => {
                        if(res == true){
                            cy.get(li).find('a').invoke('attr', 'href').then(a => {
                                cy.visit(a)
                            });
                        } else {
                            reloadFunc()
                        }
                    })
                })
            });
            cy.get_quote_po_or_order_num('po_number')
            cy.get('#po-lines > tbody').within((po_line) => {
                cy.get('tr').first().then(tr => {
                    cy.wrap(row_asserts).each(one => {
                        cy.get(tr).should('contain', one);
                        cy.log(one + ' is there.');
                    });
                });
                nav.get(po_line, 'a', 'Receive')
            });

            cy.get('#rma_po').should('contain', "PO for RMA").and('have.css', 'color', 'rgb(255, 0, 0)');
            cy.get('#po_line_qty').should('have.value', 5)
            cy.get('#receive_and_clear').click()
            cy.wait(2000)
            cy.get('.entry_success').last().should('contain', 'Parts Received, PO Line Receipt');
        });
        if(type == 'build'){
            it("Does the Rework Order", function(){
                cy.server();
                cy.route('POST', '/rma/*/update').as('rma_update');
                var our_part = 'PRTAddPart';
                part.create_prcpart_with_api(token, our_part, 'test add')
                part.receives_stock_from_api(our_part, 100)
                cy.window().then(win => {
                    cy.visit(win.sessionStorage.getItem('rma'));
                });
                nav.get('body', '.button', 'Create Rework Order')
                cy.wait('@rma_update')

                cy.get('tr#rework_data').prev().find('a').invoke('attr','href').then(a => {
                    cy.visit(a)
                });
                cy.get('.alert').should('contain', 'Re-Work Order')
                nav.side_menu('Workorder')
                nav.side_menu('Line 1')
                nav.side_menu('Maint')
                nav.side_menu('BOM Man')
                cy.get('div.header > span').should('contain', "Rework Order For RMA").and('have.css', 'color', 'rgb(255, 0, 0)')
                cy.get('#ordline_bom_table > tbody').within(() => {
                    cy.wrap(row_asserts).each(one => {
                        cy.get('tr').first().should('contain', one)
                    });
                    cy.get('input[name*="create_comp_"]').type(our_part)
                });
                cy.get('#update_bom').click()
                cy.get('input[name*="qtypertop_"]').each(one => {
                    cy.get(one).clear().type(5)
                });
                cy.get('#update_bom').click()
                nav.side_menu('Pick Parts')
                nav.get('body', 'a', 'Pick All Lines')
                nav.get('body', '.button2', 'Update')
                nav.side_menu('Invoice')

                /*
                    todo check all of the documentation/pdfs on the order 
                */

                cy.get('input[type="number"').clear().type('5')
                nav.get('body', '.button', 'Create Invoice')
                assert.success()
            });
        } else {

            it("Issues Credit Memo", function(){
                cy.server();
                cy.route('POST', '/rma/*/update').as('rma_update');
                cy.on('window:confirm', cy.stub());
                cy.visit("config/gl_account_mapping/");
                cy.get("body")
                    .find("td")
                    .contains("Customer Payment - Credit Overpayment To")
                    .parent()
                    .within(($tr) => {
                        //this might not be the correct account but on my server it was causing me errors
                        cy.get($tr).find("select").select(["114000 Receivables"]);
                    });
                nav.get("body", ".button2", "Submit"); 
                cy.window().then(win => {
                    cy.visit(win.sessionStorage.getItem('rma'));
                });
                nav.get('body', '.button', 'Issue Credit')
                cy.wait('@rma_update')
                cy.get('tr#rework_data').next().find('a').invoke('attr','href').then(a => {
                    cy.visit(a)
                });

                cy.visit('/creditmemo/51/edit')
                cy.get('#order-lines > tbody').within(() => {
                    cy.get('tr').first().should('contain', '500')
                });
                cy.get('#write_check').click()
                assert.success()
            });
        }
    }

});

