describe('Documents', function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });

    var documentation = {
        accounting: {
            type: "Accounting",
            category: ['chart_of_accounts', 'trial_balance']
        },
        customers: {
            type: "Customers",
            category: ['customer_contacts', 'customer_shiptos', 'customer_shipvias', 'customer_template'],
        },
        data_maint: {
            type: "Data Maintenance",
            category: ['business_types', 'credit_codes', 'locations', 'ship_via_codes', 'tax_authorities', 'tax_codes', 'terms_codes', 'work_centers'],
            // 'UOM',

        },
        invoices: {
            type: "Invoices",
            category: ['all_invoices', 'credit_memos'],
        },
        labor_plans: {
            type: "Labor Plans",
            category: ['labor_plans_template'],
        },
        parts: {
            type: "Parts",
            category: ['boms', 'cross_parts', 'prcs', 'uom_conversions', 'vendor_returns'],
            // 'parts_template'
        },
        purchase_orders: {
            type: "Purchase Orders",
            category: ['po_history', 'purchase_orders_template', 'unvouchered_receipts'],
        },
        sales_orders: {
            type: "Sales Orders",
            category: ['sales_orders_template'],
        },
        vendors: {
            type: "Vendors",
            category: ['vendors_template'],
        },
        vouchers: {
            type: "Vouchers",
            category: ['vouchers_template'],
        },

    };
    var grids = ["#trial_balance_grid-documentationtrialbalancegrid", '#examples_grid-documentationexamplesgrid', '#documentation_grid-documentationlistgrid']
    var trial_headings = ["ACCOUNT NO.", "DESCRIPTION", "BEGIN YR BALANACE", "PERIOD 01", "PERIOD 02", "PERIOD 03", "PERIOD 04", "PERIOD 05", "PERIOD 06", "PERIOD 07", "PERIOD 08", "PERIOD 09", "PERIOD 10", "PERIOD 11", "PERIOD 12", "Y-T-D BALANCE",]
    var trial_set = new Set();
    var grid_headings = new Set();

    for (let itm of trial_headings) {
        trial_set.add(itm);
    }

    it('Checks the documentation', function () {
        cy.server();
        cy.route('GET', '/documentation/list').as('list')
        cy.route('GET', "/documentation/category_select?**").as('category')
        cy.route('GET', "/documentation/list_grid?**").as('grid')
        cy.route('GET', "/documentation/examples_grid?**").as('examples_grid')
        cy.route('GET', "/documentation/trial_balance_grid?**").as('trial_grid')

        var doc_keys = Object.keys(documentation);
        for (let key of doc_keys) {
            cy.visit('documentation/list')
            cy.get('#' + key).click();
            cy.wait("@category")
            var categories = documentation[key].category;
            cy.wrap(categories).each(category => {
                cy.get('#category_select').select([category])
                cy.get('#category_submit').click()
                if (category == 'trial_balance') {
                    cy.wait("@trial_grid")
                    cy.log('skip')
                } else {
                    cy.wait("@grid")
                    cy.get(grids[2]).first().within(() => {
                        cy.get('tbody > tr').each(tr => {
                            cy.get(tr).within(() => {
                                cy.get('.ImportName').then(td => {
                                    var import_name = td.text();

                                    grid_headings.add(import_name)
                                });
                            });
                        });
                    });
                }

                cy.get('#examples').then(box => {
                    if (Cypress.$(box).is(":checked")) {
                        cy.log('nothing')
                    } else {
                        cy.wrap(box).check();
                    }
                })
                cy.get('#category_submit').click()
                if (category == 'trial_balance') {
                    cy.wait("@trial_grid")
                } else {
                    cy.wait("@examples_grid")
                }
                var id;
                category == 'trial_balance' ? id = grids[0] : id = grids[1]
                cy.get(id).first().within(() => {
                    cy.get('thead > tr').then(tr => {
                        cy.get(tr).within(() => {
                            cy.get('th').each((th, idx) => {
                                var th_text = th.text()
                                if (category == 'trial_balance') {
                                    cy.wrap(trial_set.has(th_text)).should('eq', true)
                                } else {
                                    cy.wrap(grid_headings.has(th_text)).should('eq', true)
                                }
                            });
                        });
                    });
                });
                grid_headings.clear();
                cy.get('#examples').then(box => {
                    if (Cypress.$(box).is(":checked")) {
                        cy.wrap(box).uncheck();
                    } else {
                        cy.log('nothing')
                    }
                })
                grid_headings.clear();
            });
        }
    });
});

