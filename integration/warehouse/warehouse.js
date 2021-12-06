import PO from '../../utils/pos';
import Part from '../../utils/part';
import Assertion from '../../utils/assertions';
import Navigation from '../../utils/navigation';
import Inventory from '../../utils/inventory';
describe("Warehouse Tab", function() {
  const pos = new PO(), 
  nav = new Navigation(), 
  part = new Part(), 
  assert = new Assertion(), 
  inv = new Inventory(), 
  moment = require('moment'), 
  prcpart = 'PRTWAREHOUSE', 
  prcpart2 = 'PRTWAREHOUSE2', 
  today = moment().format('YYYY-MM-DD'), 
  tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
  
  beforeEach(() => {
    cy.login();
    cy.viewport(1200, 700);
  });

  it("Creates a part", function() {
    part.create_prcpart_with_api('cypress_api_hack', prcpart, 'Warehouse test');
  });

  it("Creates another part", function() {
    part.create_prcpart_with_api('cypress_api_hack', prcpart2, 'Warehouse test2');
  });

  it("Receives parts from a po", function() {
    const lines = [{prcpart:prcpart, qty: 100}];
    pos.create_purchaseorder(lines);
  });
      
  it("Fills out receive stock form", function() {
    cy.server();
    cy.route("GET", "/document/object_images?object_type=Part&object_id=**").as("receivingPage");
    cy.get('[data-cy="po_lines"]').should('have.length', 1).then(() => {
      cy.get('[data-cy="po_lines"]').first().find('a').contains('Receive').click();
    });
    cy.wait("@receivingPage");
    cy.wait(5000);
    cy.window().then((win) => {
        cy.wrap(win.location.search.match(/ponum=(\d+.\d+)/)[1]).as('ponum');
      }).then(() => {
        cy.get('#ponum').should('have.value', this.ponum);
        cy.get("#packing_slip_number").type("12345");
        cy.get("#prcpart").should('have.value', prcpart);
        cy.get("#cost").type("100");
        cy.get("#quantity").should('have.value', '100');
        cy.get("#location").should('have.value', 'MN');
        cy.get("#date_added").should('have.value', today);
        cy.get("#date_code").type(today);
        cy.get("#lot_code").type(today);
        cy.get("#revision").type(today);
        cy.get("#expires_on").focus().clear().type(tomorrow).blur();
        cy.wait(1000);
        cy.get("#part_desc_display").should('contain', 'Warehouse test')
        cy.get("#duedate_display").should('contain', today);
        cy.get("#po_buyer_display").should('contain', 'Cetec ERP Support Team')
        cy.get("#qty_accepted").type("90");
        cy.get("#qty_rejected").type("10");
        cy.get("textarea[name='inspection_notes']").type("Inspection notes");
        cy.get("input[name='receive_notes']").type("Receive notes");
        cy.get('#receive_and_clear').click();
    });
    cy.get('#receive_info_row').should('contain', 'Parts Received, PO Line Receipt.');
  });

  it("Receives parts without a po", function() {
    cy.visit("/receiving/add_stock_form");
    cy.get("#prcpart").type(prcpart2);
    cy.get("#cost").type("100");
    cy.get("#quantity").type('100');
    cy.get("#location").select(['MN']);
    cy.get("#date_added").should('have.value', today);
    cy.get("#date_code").type(today);
    cy.get("#lot_code").type(today);
    cy.get("#revision").type(today);
    cy.get("#expires_on").focus().clear().type(tomorrow).blur();
    cy.wait(1000);
    cy.get("#qty_accepted").type("100");
    cy.get("textarea[name='inspection_notes']").type("Inspection notes");
    cy.get("input[name='receive_notes']").type("Receive notes");
    cy.get('#receive_and_clear').click();
    cy.get('#receive_info_row').should('contain', 'Parts Received, but no PO Receipt created.');
  });

  it('Checks the inspections', function() {
    cy.visit('/incominginspection/list');
    cy.get('input[name=prcpart]').type(prcpart);
    cy.get('#status').select(['Open']);
    cy.get('.button2').contains('Submit').click();
    assert.web_grid(
      '#web_grid-incominginspectionlist',
      [
        'tr:nth-child(1)',
      ],
      [{
        '.Loc': 'MN',
        '.PO': '.1',
        '.Line': '1',
        '.Prcpart': prcpart,
        '.QtyInspected': '100',
        '.QtyPassed': '90',
        '.QtyFailed': '10',
        '.InspectedOn': today,
        '.Status': 'Open'
      }],
    );

    cy.visit('/incominginspection/list');
    cy.get('input[name=prcpart]').type(prcpart2);
    cy.get('#status').select(['Closed']);
    cy.get('.button2').contains('Submit').click();

    assert.web_grid(
      '#web_grid-incominginspectionlist',
      [
        'tr:nth-child(1)',
      ],
      [{
        '.Loc': 'MN',
        '.PO': 'N/A',
        '.Line': 'N/A',
        '.Prcpart': prcpart2,
        '.QtyInspected': '100',
        '.QtyPassed': '100',
        '.QtyFailed': '0',
        '.InspectedOn': today,
        '.Status': 'Closed'
      }],
    );
  });
  it('Does Several Bin Put Aways', function() {
    cy.server();
    cy.route("GET", "/inv/get_bins?**").as("movePage");
    cy.request({
      method: "PATCH",
      url: "/api/config/Prevent%20Bin%20Merge",
      dataType: "json",
      body: {
        value: 0,
      },
    });
    cy.request({
      method: "PATCH",
      url: "/api/config/Prevent%20Bin%20Merge%20-%20MN",
      dataType: "json",
      body: {
        value: 0,
      },
    });
    cy.visit('/receiving/pending_receipts');
    cy.get(`[data-cy=${prcpart}]`).find('a').contains('Put Away').click();
    cy.get('#qty').focus().clear().type('50');
    cy.get('#bin').focus().clear().type('hey');
    cy.get('#bin_submit').click();
    // Bin Merge
    cy.get(`[data-cy=${prcpart}]`).find('a').contains('Put Away').click();
    cy.get('#qty').focus().clear().type('50');
    cy.get('#bin').focus().clear().type('hey');
    cy.get('#bin_submit').click();
    cy.wait("@movePage");
    cy.wait(2000);
    cy.get('[data-cy=bin_popup_table]').within(($this) => {
      cy.wrap($this).find('#merge_bin').click();
    });
    // Bin Split With Suffix
    cy.get(`[data-cy=${prcpart2}]`).find('a').contains('Put Away').click();
    cy.get('#qty').focus().clear().type('50');
    cy.get('#bin').focus().clear().type('hey');
    cy.get('#bin_submit').click();
    cy.get(`[data-cy=${prcpart2}]`).find('a').contains('Put Away').click();
    cy.get('#qty').focus().clear().type('50');
    cy.get('#bin').focus().clear().type('hey');
    cy.get('#bin_submit').click();
    cy.wait("@movePage");
    cy.wait(2000);
    cy.get('[data-cy=bin_popup_table]').within(($this) => {
      cy.wrap($this).find('#bin_suffix').click();
    });
  });

  it('Checks the bins changes', function() {
    cy.visit('/');
    part.goto_prcpart(prcpart);
    inv.check_bin('MN', 'hey', '100');
    part.goto_prcpart(prcpart2);
    inv.check_bin('MN', 'hey', '50');
    inv.check_bin('MN', 'hey-1', '50');
  });
});
