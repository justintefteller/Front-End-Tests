class Orders {

    log_work (url, time) {
        const [hours, minutes] = time;
        let assertMin = 0;
        if(hours){
            assertMin += hours * 60 
        }
        if(minutes){
            assertMin += minutes
        }

        if(url){
            cy.visit(url);
            cy.get('#labor').click()
            cy.get("#show_time_popup").click();
            cy.get("#add_work_form > .block_time_entry").scrollIntoView().find('#add_and_close_hours').focus().type(hours).blur();
            cy.get("#add_work_form > .block_time_entry").scrollIntoView().find('#add_and_close_minutes').focus().type(minutes).blur();
            cy.get("#add_work_form").find('.submit_form').last().click();
            cy.wait(3000);
            cy.get("#chart").should("be.visible");
            cy.get('[data-cy=time_logged]').invoke('text').should('contain', assertMin)
        } else {
            cy.window().then(function(win) {
                let work_view = win.location.pathname.match(/work_view/)[0];
                cy.wrap(work_view).as('work_view')
            }).then(function(){
                if(!this.work_view){
                    throw new Error('Need to be at the work_view page!');
                }
                cy.get('#labor').click()
                cy.get("#show_time_popup").click();
                cy.get("#add_work_form > .block_time_entry").scrollIntoView().find('#add_and_close_hours').focus().type(hours).blur();
                cy.get("#add_work_form > .block_time_entry").scrollIntoView().find('#add_and_close_minutes').focus().type(minutes).blur();
                cy.get("#add_work_form").find('.submit_form').last().click();
                cy.wait(3000);
                cy.get("#chart").should("be.visible");
                cy.get('[data-cy=time_logged]').invoke('text').should('contain', assertMin)
            });
        }

    }
   
}

export default Orders;
