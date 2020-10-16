import Navigation from '../utils/navigation';
import Assertion from '../utils/assertions';
import Quotes from '../utils/quotes';
import General from '../utils/general';

describe('Quote Tab', function () {
    beforeEach(() => {
        cy.login();
    });
    var nav = new Navigation();
    var assert = new Assertion();
    var quote = new Quotes();
    var gen = new General();

    var info = gen.info(7);
    var prcpart = `PRT${gen.info(7)}`;

    var [today, futureDate] = gen.dates();

    it('Creates a Quote and Changes the Status', function () {
        cy.visit('/quote/list');
        nav.get('body', '.button','Create');
        cy.visit('/quote/my_quotes');
        cy.get('.Quote').find('a').last().contains(`Quote `).should('be.visible').then($quote => {
            cy.wrap($quote).click();
            cy.get('.edit-header-button').click();
            cy.get('#status').select('Pending');
            cy.get('#update_header_button').click();
        });
        cy.visit('/quote/my_quotes');
        cy.get('.vertical_nav_notab').find('a').contains('Pending').click();
        cy.get('.Quote').find('a').last().contains(`Quote `).should('be.visible').then($quote => {
            cy.wrap($quote).click();
            cy.get('.edit-header-button').click();
            cy.get('#status').select('Closed');
            cy.get('#update_header_button').click();
        });
        cy.visit('/quote/my_quotes');
        cy.get('.vertical_nav_notab').find('a').contains('Closed').click();
        cy.get('.Quote').find('a').contains(`Quote `).last().should('be.visible');
    });

    it('Fills Out All Quote Info', function () {
        cy.visit('/quote/list');
        cy.server()
        cy.route('GET', '/quote/*/get_totals').as('getTotal')
        cy.route('GET', '/inv/search*').as('invSearch')
        nav.get('body', '.button','Create');
        quote.fill_required_header_info('Internal')
        quote.fill_first_line('CMP1', 10, 100, 10);
        cy.get('#quote-lines > tbody > tr').first().then($line => {
            //the selects game me a lot of trouble down here need to rework them 
            let line_id = Cypress.$($line).attr('line_id')
            cy.get('.edit-line-button').first().click()
            cy.get('#edit_location').should('have.value', 'MN')
            cy.get('#prcpart').should('have.value', 'CMP1')
            cy.get('#wip_date_' + line_id).clear().type(futureDate)
            cy.get('#promise_date_' + line_id).clear().type(futureDate)
            cy.get('#due_date_' + line_id).clear().type(futureDate)
            cy.get('#transcode-1').select('SA')
        }).then(() => {
            cy.get('.qty_break_row').last().then($row => {
                let row = Cypress.$($row).attr('row')
                cy.get('#qty_' + row).clear().type(100)
                cy.get('#resale_' + row).then($resale => {
                    cy.wrap($resale).wait(2000).clear().type(' ')
                    cy.wrap($resale).wait(2000).clear().type(100)
                })
                cy.get('#cost_' + row).then($cost => {
                    cy.wrap($cost).wait(2000).clear().type(' ')
                    cy.wrap($cost).wait(2000).clear().type(50)
                })
                cy.wait('@invSearch').its('status').should('be', 200)
                cy.get('#leadtime_' + row).clear().wait(1000).type(10)
                cy.get('#notes_' + row).type(info)
                cy.get('#editMoreBtn').click()
                cy.get('#comment-1').type(info)
                cy.get('#warnings-1').type(info)
                cy.get('#desc-span').contains('test part CMP1').should('be.visible')
                cy.get('#quote_comments').type(info)
                cy.get('#sourcing-1').type(info)
                cy.get('.edit-line-submit').contains('OK').click()
            })
        });

        cy.get('#quote-lines > tbody > tr').first().then($line_id => {
            let line_id = Cypress.$($line_id).attr('line_id')
            cy.get('#promise_date_1').should('have.value', `${futureDate}`)
            cy.get('#due_date_1').should('have.value', `${futureDate}`)
            cy.get('#qty_1').should('have.value', '100').then($break_id => {
                let break_id = Cypress.$($break_id).attr('break_id')
                cy.get(`#tax_${break_id}`).contains('$0.00')
                cy.get(`#ext_resale_for_break_${break_id}`).contains('$10,000.00')
            })
            cy.get('#cost_1').should('have.value', '$50.00')
            cy.get('#resale_1').should('have.value', '$100.00')
            cy.get('input[name="freight_estimate"]').type(100)
            cy.get('input[name="freight_discount"]').type(50)
            cy.get('#display_freight_resale').should('have.value', '$100.00')
            cy.get('#ext_resale').contains('$10,000')
            cy.get('#total_resale').contains('$10,100')
        })
    });

    it("Checks the quote pdf", function(){
        var header = [ 
            ["From", "Cetec ERP", 'Bill To', "Ship To", "Internal Customer"],
            ["Order Type", "Unscheduled", 'FOB', "S - Shipment", "Terms", "Credit Card"],
            ["Tax Group", "(0%)","Ship Type", "Partial", "Ship Via", "UPS Ground"],
            ["Carrier Account", "12345"],
            ["Comments", "External Comments Go Here"],
            ["Shipping", "Shipping Comments Go Here"],
        ]
        nav.side_menu('Send')
        nav.side_menu('PDF')
        //checks all the check boxes
        cy.get('#form_target').within(() => {
            cy.get('table > tbody > tr').each($tr => {
                cy.wrap($tr).within(() => {
                    cy.get('td').find('input').check()
                });
            });
        });
        //header check
        cy.get('#pdf_preview').within(() => {
            cy.get('tbody > tr').each((tr, idx) => {
                if(idx != 4 && idx < 7){
                    var index;
                    idx >= 4 ? index = idx -1 : index = idx;
                    cy.wrap(header[index]).each(itm => {
                        cy.wrap(tr).should('contain', itm)
                    })
                }
            });
        });
        //footer check
        var line = ["CMP1", "CMP","1", futureDate, "10 weeks",100,"$100.00","$0.00","$0.00"	,"$10,000.00"]
        cy.get('#quote-lines').within(() => {
            cy.get('tbody').first().within(() => {
                cy.get('tr').first().then((tr) => {
                    cy.wrap(line).each(itm => {
                        cy.wrap(tr).should('contain', itm)
                    });
                });
            });
        });
        //footer check
        var footer = [['Total Weight:', 0], ['Freight:', "$100.00"], ["Tax:", "$0.00"], ["Total:", "$10,100.00"]];
        cy.get('#quote-lines').within(() => {
            cy.get('tbody').last().within(() => {
                cy.get('tr').each((tr, idx) => {
                    cy.wrap(footer[idx]).each(itm => {
                        cy.wrap(tr).should('contain', itm)
                    });
                });
            });
        });
    });

    it('Deletes line, Creates Non-Exisiting Part on Quote, Clones line', function () {

        var confirm_click = cy.stub()
        nav.side_menu('View')
        cy.get('.delete_line').click()
        cy.get('#delete_lines').click()
        cy.on("window:confirm", confirm_click)
        cy.get('.add').contains('Add Line').click()
        cy.get('#new_prcpart').type(prcpart)
        cy.get('#wip_date').clear().type(today)
        cy.get('#promise_date').clear().type(today)
        cy.get('#due_date').clear().type(today)
        cy.get('#new_qty').type(10)
        cy.get('#new_cost').type(10)
        cy.get('#new_resale').type(100)
        cy.get('#new_leadtime').type(7)
        cy.get('#new_transcode_').select('NN')
        cy.get('#moreBtn').click()
        cy.get('#revision').type(info)
        cy.get('#new_comment').type(info)
        cy.get('#shipvia').select('Fedex Ground')
        cy.get('#warnings-').type('Fedex Ground')
        cy.get('#new_prcpart_description').type(info)
        cy.get('#quote_comments_new').type(info)
        cy.get('#new_sourcing').type(info)
        cy.get('#update_cost').parent().find('.button2').contains('OK & Add').click()
        cy.get('#quote-lines > tbody > tr').then($line_id => {
            var line_id = Cypress.$($line_id).attr('line_id')
            cy.get('#promise_date_1').should('have.value', today)
            cy.get('#due_date_1').should('have.value', today)
            cy.get('#qty_1').should('have.value', '10').then($break_id => {
                var break_id = Cypress.$($break_id).attr('break_id')
                cy.get('#cost_1').should('have.value', '$10.00')
                cy.get('#resale_1').should('have.value', '$100.00')
                cy.get(`#tax_${break_id}`).should('contain','$0.00')
                cy.get(`#ext_resale_for_break_${break_id}`).should('contain','$1,000.00')
            })
            cy.get(`#buttons_for_${line_id} > span > a.confirm > img`).click()
            cy.on("window:confirm", confirm_click)
            cy.get('#quote-lines > tbody > tr').then($prcparts => {
                expect($prcparts).to.have.length(3)
                expect($prcparts.eq(0, '1')).to.contain(`${info}`)
                expect($prcparts.eq(1, '2')).to.contain(`${info}`)
            })
        })
    })

    //can't get the iFrame to work
    // it('Creates a Customer', function(){
    //     var cust = 'Quote Test';
    //     var encoded_cust = 'Quote%20Test';
    //     cy.visit('/customer/list')
    //     cy.get('.customer_search').type(cust)
    //     nav.get('body', '.button2', 'Submit')
    //     assert.exists('#web_grid-customerlist > tbody > tr').then(res => {
    //         if(res == true){
    //             cy.get('#web_grid-customerlist > tbody > tr').first().find('td.CustomerName').click()
    //         }else {
    //             cy.visit(`/customer/create?coname=${encoded_cust}`)
    //         }
    //     });
    //     nav.side_menu('Edit')
    //     cy.get('#credit_code').select('3')
    //     cy.get('input[name="taxtype"]').last().check()
    //     nav.get('body', '.button','Update')
    //     nav.side_menu('View')
    // });

    // const do_bill_to = () => {
    //     cy.get('iframe[class="cboxIframe"]').then($iframe => {
    //         var $body = $iframe.contents()
    //         cy.wrap($body).then($b => console.log($b.prevObject[0].contentDocument))
    //     })
    // }
     
    // it('Changes the Bill To Address', function(){
    //     assert.exists('#customer-address > tbody > tr').then(res => {
    //         if(res == true){
    //             cy.get('#customer-address > tbody > tr').each($tr => {
    //                 cy.wrap($tr).within(() => {
    //                     assert.text_exists('td[title="Code: "]', "Bill To").then(response => {
    //                         if(response == false){
    //                            cy.get('#add_address_button').click()
    //                            do_bill_to()
    //                         }else {
    //                             cy.visit('/quote/list')// change this to actual quote
    //                         }
    //                     })
    //                 })
    //             })
    //         }else {
    //             cy.get('#add_address_button').click()
    //             do_bill_to()
    //         }
    //     })

    // });

    it('Clones the Quote and Changes All Line Feature', function () {
        //need to add to the test the extra quote change all line features
        cy.get('.vertical_nav_notab').find('a').contains('Quoting Tools +').click()
        cy.get('.sidenav_subnav').find('a').contains('Clone This Quote').click()
        cy.get('.status_message').should("contain", 'Created From')
        cy.get('.show_global_line_edit').first().click()
        cy.get('#global_location').select('MZ')
        cy.get('#update_all_line_locations').click()
        cy.get('#all_line_locations_message').should('be.visible').contains('OK!')
        cy.get('.global_cost_center').select('2')
        cy.get('#update_all_cost_centers').click()
        cy.get('#all_cost_centers_message').should('be.visible').contains('OK!')
        cy.get('#global_ship_date').clear().type(futureDate)
        cy.get('#update_all_ship_dates').click()
        cy.get('#global_dock_date').clear().type(futureDate)
        cy.get('#update_all_dock_dates').click()
        cy.wait(2000)
        cy.get('#promise_date_1').should('have.value', futureDate)
        cy.get('#due_date_1').should('have.value', futureDate)
        cy.get('#promise_date_2').should('have.value', futureDate)
        cy.get('#due_date_2').should('have.value', futureDate)
        cy.get('#quote-lines > tbody > tr').first().then($line_id => {
            Cypress.on('uncaught:exception', (err, runnable) => {
                return false
            });
            var line_id = Cypress.$($line_id).attr('line_id')
            cy.get('#buttons_for_' + line_id).scrollIntoView().find('a').first().click()
            cy.get('#edit_location').invoke('val').should('be.eq', 'MZ')
            cy.get('#editMoreBtn').click()
            cy.get('#more_settings').find('select').contains('Cost Center 2').invoke('val').should('be.eq', '2')
        })
        cy.get('#quote-lines > tbody > tr').last().prev().then($line_id => {
            var line_id = Cypress.$($line_id).attr('line_id')
            cy.get('#buttons_for_' + line_id).scrollIntoView().find('a').first().click()
            cy.get('#edit_location').invoke('val').should('be.eq', 'MZ')
            cy.get('#editMoreBtn').click()
            cy.get('#more_settings').find('select').contains('Cost Center 2').invoke('val').should('be.eq', '2')
        })
    })

    it('Edits +/- Columns and Adds a Note', function () {
        cy.get('.kinda_show_grid_control').scrollIntoView().click()
        cy.get("#web_grid_control_quote-lines").then($body => {
            cy.wrap($body).find('input[type="radio"]').then($radio => {
                cy.wrap($radio).each(($one, index) => {
                    if (index % 2 == 0) {
                        cy.wrap($one).click()
                    }
                })
            })
        })
        cy.get('#cboxClose').click()
        cy.wait(2000)
        cy.get('table.web_grid > thead > tr > th').then($th => {
            cy.wrap($th).its('length').should('be.gt', 20)
            // expect($th).to.have.length('gt', 20)
        })
        cy.get('.vertical_nav_notab').find('a').contains('Notes').click()
        cy.get('#add_note_button').click()
        cy.get('#note_add_comment').type(info)
        cy.get('#note_date_time ').type(today)
        cy.get('#note_add_submit').click()
        cy.get('#sticky-note').should('be.visible')
    })

    it('Commits the Quote', function () {
        cy.get('.vertical_nav_notab').find('a').contains('Commit').click()
        cy.get('#place-order-button').click()
        cy.get('.status_message').contains('Created Order')
    })
})
