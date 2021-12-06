class Notes {
    create_note = (note_type, note, sticky) => {
		cy.get('#note_type_id').select([note_type]);
		cy.get('#add_note_button').click();
        cy.get('#note_add_comment').should('be.visible').focus().type(note)
        cy.get('#note_date_time').click().blur();
        if(sticky){
            cy.get('input[name="sticky"]').check();
        }
        cy.get('#note_add_submit').click();
        cy.reload();
        cy.get('#note-display > li')
            .should('have.length', 1)
            .find('span')
            .contains(note)
            .should('contain', note);
    }
}

export default Notes;
