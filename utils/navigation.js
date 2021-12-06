class Navigation {
    main_menu = (category, subNav, item ) => {
        if(category){
            cy.get('#main_nav').find('li').contains(category).click();
            if(subNav){
                cy.get('.sub-nav:visible > .container').find('a').contains(subNav).click();
                if(item){
                    cy.get('.subnav:visible').find('a').contains(item).click();
                }
            }
        }
    }

    side_menu = (nameOfLink) => {
        return cy.get(".vertical_nav_notab").find("a").contains(`${nameOfLink}`).click();
    };
    
    get = ($el, $el2, $description) => {
        if (!$el) {
            cy.log("need to add the first element");
            return;
        } else if (!$el2 && !$description) {
            return cy.get($el).click();
        } else if (!$el2) {
            return cy.get($el).contains($description).click();
        } else if (!$description) {
            return cy.get($el).find($el2).click();
        } else {
            return cy.get($el).find($el2).contains($description).click();
        }
    };

    get_dropdown = (desc) =>  {
        //hopefully the should will retry until if finds the dropdown 
        return cy.get(".ui-menu-item-wrapper", {timeout: 10000}).should('contain', `${desc}`).click()
    };


    do_inputs = (selects='', inputs='', textarea='') => {
        var contents = [selects, inputs, textarea];
        contents.forEach((type, idx) => {
            Object.keys(type).forEach((key) => {
                if (idx == 0) {
                    cy.get(key).select(type[key]);
                } else if (idx == 1) {
                    cy.get(key).focus().clear().type(type[key]).blur();
                }else{
                    cy.get(key).clear().type(type[key]);
                }
            });
        });
    }
    //not entirely sure this works...
    set_web_grid_controls = (table) => {
        cy.get('.kinda_show_grid_control').click()
        cy.get(`#web_grid_control_${table}_table`).within($control => {
            cy.get("input[type='radio']").each((box, i) => {
                if(i == 0 || i % 2 == 0){
                    cy.get(box).click()
                }
            });
        });               
        cy.get('#cboxClose').click();
    }

}

export default Navigation;
