import Navigation from '../../utils/navigation'
describe('Admin Tab', function () {
    var nav = new Navigation();
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });
    it('Creates users', function(){
        var users = [{username:"Sales Guy", role: 'Sales'}, {username:"Purchasing", role: 'Purchasing'}, {username:"Accounting", role: 'Accounting'}]
        cy.creates_user(users)
        cy.logout()
    });
    it('Edits the user profile', function(){
        var content = ['Justin', 'Tefteller', 'sales', 'sales','CEO', 'justin@cetecerp.com','','', '5122008089', '5125751050', 'JT','', ]
        var check_content = ['Justin', 'Tefteller', '', '', 'CEO', 'justin@cetecerp.com','','', '5122008089', '5125751050', 'JT','', ]
        cy.sales_login()
        cy.visit('/auth/login_as_another_user?username=Sales%20Guy')
        cy.visit('/')
        cy.get('#user_menu_button').click()
        cy.get('#user_menu_dropdown').find('a').contains('My Profile').click()
        cy.get('#user-container').within(() =>{
            cy.get('.textfield').each((input, idx) => {
                cy.wrap(input).then($this => {
                    var id = $this.attr('id') 
                    if(id == 'email_password' || id == 'email_password2' || id == 'signature_file'){
                        cy.log('skipped')
                    }else{
                        cy.get(input).clear().type(content[idx])
                    }
                })
            });
        });
        nav.get('body', '.button2','Update')
        cy.get('#user-container').within(() =>{
            cy.get('.textfield').each((input, idx) => {
                cy.wrap(input).then($this => {
                    var id = $this.attr('id') 
                    if(id == 'email_password' || id == 'email_password2' || id == 'signature_file' || id == 'password' || id == 'confirm_password'){
                        cy.log('skipped')
                    }else{
                        cy.get(input).should('have.value', check_content[idx])
                    }
                })
            });
        });
    });
});

