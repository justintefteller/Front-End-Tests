import Navigation from './navigation';
var nav = new Navigation();
class User {
    creates_user = (users) => {
        cy.wrap(users).each(user => {
    
            cy.wrap(user).its('username').then(function(username){
                cy.wrap(username).as('password');
            }).then(function(){
                cy.visit("/user/list");
                cy.get("table > tbody > tr > td > #create_user_button").click();
                cy.wrap(user).its('username').then(username => {
                    cy.get('#create_user_form > div > input[name="username"]')
                        .type(username)
                        .should("have.value", `${username}`);
                });
                cy.get('#create_user_form > div > input[name="password"]')
                    .type(this.password)
                    .should("have.value", `${this.password}`);
                cy.get("#new_user_submit_botton").click();
                cy.get(
                    "#cboxLoadedContent > .create_user > .column > #create_user_form > #form_error"
                ).then(($error) => {
                    cy.wait(1000);
                    cy.wrap($error)
                        .invoke("text")
                        .then(($text) => {
                            if (!$text) {
                                cy.wrap(user).its('role').then(role => {
                                    cy.get('#role').select([`${role}`]);
                                    nav.get('body', '.button2', 'Submit')
                                });
                            }
                            if ($text.includes("User already exists!")) {
                                cy.get("#cboxClose").click();
                            }
                    });
                });
            });
        });
    }

    login = (username, password) => {
        password = password ? password : username;
        if(!username){
            username = "techx";
            password = "ATreeGrowsSlowly531";
        }
        cy.request({
            url: "/auth/login",
            method: "POST",
            form: true,
            followRedirect: false,
            body: {
                username: username,
                password: password,
            },
        });

        cy.request({
            url: "/auth/eula",
            method: "POST",
            form: true,
            followRedirect: false,
            body: {
                i_agree: "1",
            },
        });
    
        //global set api config for cypress tests
        cy.request({
            method: "PATCH",
            url: "/api/config/JSON%20API%20Token",
            dataType: "json",
            body: {
                value: "cypress_api_hack",
            },
        });
    
        //Don't kill pid in root for exception error handler
        cy.request({
            method: "PATCH",
            url: "/api/config/Do%20Not%20Die%20On%20Errors",
            dataType: "json",
            body: {
                value: 1,
            },
        });
    
        //Don't email on error
        cy.request({
            method: "PATCH",
            url: "/api/config/Do%20Not%20Email%20On%20Errors",
            dataType: "json",
            body: {
                value: 1,
            },
        });
        return;
    };

    logout = (el) => {
        cy.visit('/auth/logout')
        cy.get('#username').should('be.visible')
    }; 

    go_to_user_page = (user_page, bookmark) => {
        cy.get('#user_menu_button').click().then(function(){
            cy.get('#user_menu_dropdown').within(function(){
                cy.get('li > a').contains(user_page).click();
                if(user_page == 'Bookmarks'){
                    cy.get('#bookmark_title').type(bookmark);
                    cy.get('#add_bookmark').click();
                }
            });
        });
    }
    visit_bookmark = (bookmark) => {
        cy.get('#user_menu_button').click().then(function(){
            cy.get('#user_menu_dropdown').within(function(){
                cy.get('li > a').contains('Bookmarks').click();
                cy.get('#bookmarks_display').find('a').contains(bookmark).click();
            });
        });
    }
}

export default User;
