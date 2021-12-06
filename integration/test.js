import User from '../utils/user';
import Navigation from '../utils/navigation';
import Documents from '../utils/documents';
import Notes from '../utils/notes';

describe('Order Edit', function () {
	const user = new User();
	const nav = new Navigation();
	const docs = new Documents();
	const note = new Notes();

	beforeEach(() => {
		cy.viewport(1200, 700);
		user.login();
	});

	it('Logins In', function () {
		user.login();
	});

	it('Creates users', function () {
		user.creates_user([
			{ username: "Sales Admin", role: 'Admin' },
			{ username: "Purchasing", role: 'Purchasing' },
			{ username: "Accounting", role: 'Accounting' }
		]);
	});

	it('It Logins in as Sales and edits Profile', function () {
		user.logout();

		user.login("Sales Admin");
		cy.visit('/');
		user.go_to_user_page("My Profile");

		//fill it out
		cy.get('#firstname').should('be.empty').type('Mike');
		cy.get('#lastname').should('be.empty').type('Jones');
		cy.get('#password').should('be.empty').type('Jones');
		cy.get('#confirm_password').should('be.empty').type('Jones');
		cy.get('#title').should('be.empty').type('CEO');
		cy.get('#email').should('be.empty').type('the_president@cetecerp.com');
		cy.get('#phone').should('be.empty').type('251-330-8004');
		cy.get('#mobile').should('be.empty').type('251-330-8004');
		cy.get('#email_signature').focus().type('Mike Jones Out.').blur();
		cy.get('[data-cy=update]').first().click();

		//assert it
		cy.get('#firstname').should('have.value', 'Mike');
		cy.get('#lastname').should('have.value', 'Jones');
		cy.get('#title').should('have.value', 'CEO');
		cy.get('#email').should('have.value', 'the_president@cetecerp.com');
		cy.get('#phone').should('have.value', '251-330-8004');
		cy.get('#mobile').should('have.value', '251-330-8004');
		cy.get('#email_signature').should('have.value', 'Mike Jones Out.');
	});

	it('Attachs a Document', function () {
		user.logout();
		user.login("Sales Admin", "Jones");
		cy.visit('/');
		user.go_to_user_page("My Profile");
		nav.side_menu("Documents")
		cy.window().then(win => {
			cy.wrap(win.location.pathname).then(function(pathname){
				cy.wrap(pathname.match(/\d*/gi)[6]).as('user_id');
			}).then(function(){
				docs.upload_document(
					"/assets/user_file.json", 
					this.user_id, 
					'User', 
					'application/json'
				);
			});
		});
		cy.get('.web_grid').find('tbody').find('tr').should('have.length', 1);
	});

	it('Creates Notes', function () {
		user.logout();
		user.login("Sales Admin", "Jones");
		cy.visit('/');
		user.go_to_user_page("My Profile");
		nav.side_menu("Notes (");
		note.create_note('Reminder', "This is a reminder.", 1);
	});

	it('Creates A Bookmark', function () {
		cy.visit('/part/list')
		user.go_to_user_page('Bookmarks', "Part List");
		cy.visit('/');
		user.visit_bookmark("Part List");
		cy.window().then(win => {
			cy.wrap(win.location.pathname).then(function(pathname){
				cy.wrap(pathname).should('contain', '/part/list');
			});
		})
	});


});