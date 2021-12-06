import Navigation from "./navigation"

var nav = new Navigation();

class Assertion {

        assert_row = (el, desc, assertions=[]) => {
            if(!desc) return;
            if(!assertions) return;
        
            var element;
            el ? element = `${el}` + " > " :  element = '';
            return cy.wrap(assertions).each(assertion => {
                cy.get( element + "table > tbody > tr").each($tr => {
                    if($tr.text().includes(`${desc}`)){
                        cy.get($tr).within($this => {
                            cy.get($this).should('contain', assertion)
                        });
                    }
                });
            });
        };

        assert_tfoot_row = (el, desc, assertions=[]) => {
            if(!desc) return;
            if(!assertions) return;
        
            var element;
            el ? element = `${el}` + " > " :  element = '';
            return cy.wrap(assertions).each(assertion => {
                cy.get( element + "table > tfoot > tr").each($tr => {
                    if($tr.text().includes(`${desc}`)){
                        cy.get($tr).within($this => {
                            cy.get($this).should('contain', assertion)
                        });
                    }
                });
            });
        };

        success = (message) => {
            if(message){
                return cy.get('.status_message').should("contain", "Success").and("contain", `${message}`)
            }else{
                return cy.get('.status_message').should("contain", "Success")
            }
        };

        check_global_ledger = (id, type, amounts=[] , rows) => {
            if(!id || !type || !amounts){
                cy.log({
                    message: 'Need to add id, type, or amounts to check_global_ledger'
                });
                return null;
            }
            cy.visit('ledger/ledger')	
            cy.get('#more_options').click()
            cy.get('input[name="object_type"]').type(type)
            cy.get('input[name="object_id"]').type(id)
            nav.get('body', '.button2', 'Submit')
            cy.get('#web_grid-ledgerledger > tbody').within(() => {
                cy.get('.Amount').each(($entry, $idx, $total) => {
                    if(rows){
                        cy.wrap($total).should('have.length', rows)
                    }
                    if($entry.text().includes(amounts[$idx])){
                        cy.get($entry).should('contain', `${amounts[$idx]}`)
                    }
                });
            });
        };
        
        check_object_ledger = (amount) => {
            //only for when you are inside the object
            //something like creditmemo/1/edit
            //it does the looks ups for you and uses the side menu to get there.
            if (!amount) {
                cy.log({
                    message: "Need to add amount to check_ledger"
                });
                return null;
            }
            var negative_amount = amount * -1;
            nav.side_menu('Ledger')
            cy.get('.Amount').each(($entry, $idx) => {
                if($idx == 0){
                    cy.log('skip header')
                }else if($entry.text().includes(negative_amount)){
                    cy.get($entry).should('contain', `${negative_amount}`)
                }else {
                    cy.get($entry).should('contain', `${amount}`)
                }
            });
        };

        exists = (el) => {
            //inside the commands.js
            return cy.exists(el)
        }

        text_exists = (el, text) => {
            //inside the commands.js
            return cy.text_exists(el, text)
        }

        web_grid = (gridId, rows, rowContent) => {
            cy.get(`${gridId} > tbody`).within(() => {
                cy.wrap(rows).each((row,idx) => {
                    cy.get(row).then(tr => {
                        cy.wrap(Object.keys(rowContent[idx])).each((selector) => {
                            cy.wrap(tr).find(selector).should('contain', rowContent[idx][selector]);
                        });
                    });
                })
            });
        }
}

export default Assertion;
