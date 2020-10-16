class Navigation {

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
        return cy.get(".ui-menu-item-wrapper", {
            timeout: 10000,
        })
            .contains(`${desc}`)
            .click();
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

}

export default Navigation;
