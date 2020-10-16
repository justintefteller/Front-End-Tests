import Navigation from '../utils/navigation';

describe('Data Maint Tab', function () {
    const nav = new Navigation();
    beforeEach(() => {
        
        cy.login();
        cy.viewport(1200, 700);

        function AddRecord(url, urls) {
                var table = [];
                var assertion_table = [];

                if(urls[url] == "/tablemaint/SHPCE/edit" || urls[url] == "/tablemaint/WorkflowStage/edit" || urls[url] == "/tablemaint/AddressCountry/edit" || urls[url] == "/tablemaint/DiscountType/edit" || urls[url] == "/tablemaint/ExpenseLogEntryType/edit" || urls[url] == '/tablemaint/ExpenseLogPaymentType/edit' || urls[url] == '/tablemaint/SystemControlType/edit' || urls[url] == '/tablemaint/SHPCDE/edit' || urls[url] == '/tablemaint/CurrencyRate/edit' || urls[url] == '/tablemaint/ExternalSource/edit' || urls[url] == '/tablemaint/OSHIPG/edit' ||urls[url] == '/tablemaint/OpportunityType/edit' ||urls[url] == '/tablemaint/RentalChargeReason/edit' || urls[url] == '/tablemaint/RentalFailureType/edit' || urls[url] == '/tablemaint/SystemControlType/edit' || urls[url] == '/tablemaint/UOM/edit' ){
                    //need to make separate functions for these
                    cy.log('skipping table for now')
                }else{

                    cy.visit(urls[url])
                    cy.get('.web_grid > tbody > tr').first().within($tr => {
                        cy.get('td').each(function($td){
                            if($td.find('input').length > 0){
                                cy.get($td).within(() => {
                                    cy.get('input').then($input =>{
                                        if ($input.attr('type') == 'hidden') {
                                            cy.log('skipped')
                                        } else if(!$input.attr('value')){
                                            cy.log('skipped')
                                        }else if($input.attr('type') == 'text') {
                                            table.push({[$input.attr('name')]: $input.attr('value')})
                                        }
                                    });
                                });
                            }
                        });
                    });
                    
                    cy.get('input[name=delete]').first().check()
                    nav.get('body', '.button2', 'Submit')
                    nav.get('body', '.button', 'Add Record')

                    cy.wrap(table).each((obj) => {
                        var name = Object.keys(obj).toString()
                        var value = Object.values(obj);
                        name = name.replace(/\d*/g, '');
                        cy.get(`input[name*=${name}]`)
                            .first()
                            .clear()
                            .type(`${value}`)
                            .invoke('attr','name')
                            .then($name => {
                                assertion_table.push({[$name]: `${value}`})
                            });
                    });

                    nav.get('body', '.button2', 'Submit')

                    cy.wrap(assertion_table).each(obj => {
                        var name = Object.keys(obj).toString()
                        var value = Object.values(obj);
                        cy.get(`input[name="${name}"]`).should('have.value', `${value}`)
                    })
                    cy.log(`${url} is good`)
                }
            }
        cy.wrap(AddRecord).as('AddRecord');

        //Skipping for now
        // function data_maint_helper(url, urls){
        //     cy.get('.web_grid_pager').first().then(display => {
        //         if(display.text().includes('Displaying 0 - 0 of 0')){
        //             nav.get('body', '.button', 'Add Record')
        //             return 1;
        //         }else{
        //             AddRecord(url, urls)
        //         }
        //     });
        // }

        // function AddressCountry(url, urls){
        //     var result = data_maint_helper(url, urls);
        //     if(result == 1){
        //         cy.get('.web_grid > tbody > tr').first().within($tr => {
        //             cy.get('td').each(function($td){
        //                 if($td.find('input').length > 0){
        //                     cy.get($td).within(() => {
        //                         cy.get('input').then($input =>{
        //                             if ($input.attr('type') == 'hidden') {
        //                                 cy.log('skipped')
        //                             } else if(!$input.attr('value')){
        //                                 cy.log('skipped')
        //                             }else if($input.attr('type') == 'text') {
        //                             cy.get($input).type('TT')
        //                             }
        //                         });
        //                     });
        //                 }
        //             });
        //         })
        //         nav.get('body', '.button2', 'Submit')
        //     }
        // }
        
        // cy.wrap(AddressCountry).as('AddressCountry');
    });

    it('Get All Tables and Save into Env Variable', function(){
        var urls = {};
        cy.visit('/tablemaint/list')
        cy.get("#grid-tablemaintlist").find('a').each($a => {
            var key = $a.text()
            var value = $a.attr('href').match(/\/tablemaint\/.*\/edit/)
            urls[key] = value[0]
        }).then(() => {
            for(let url in urls){
                this.AddRecord(url, urls)   
            }
        })
    });
});

