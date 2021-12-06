import Navigation from '../../utils/navigation';
import Inventory from '../../utils/inventory';
import Part from '../../utils/part';
import Assertion from '../../utils/assertions';

describe('Inventory', function () {
	const nav 	= new Navigation(),
		part 	= new Part(),
		inv 	= new Inventory(),
		assert 	= new Assertion(),
		prc		= "CMP",
		prcpart = "CMPInventory";

	beforeEach(() => {
		cy.viewport(1200, 700);
		cy.login();
	});

	it('Creates a part', function(){
		part.create_prc(prc)
		part.create_prcpart(prcpart)
	});

	it('Receives stock', function(){
		part.receive_stock_without_po(prcpart)
	});

	it('Edits Bin Related Data', function(){
		cy.server();
		cy.route({method:'POST', url:'/part/update_lot_data'}).as('update_lot_data');
		cy.visit('/');
		part.goto_prcpart(prcpart);
		cy.get('[data-cy="MN"]').find('a').contains('Edit').click()
		cy.get('[data-cy="MN"]').within(() => {
			cy.get('.bin_details').first().within(() => {
				cy.get('input[id*=date_code]').type('Now');
				cy.get('input[id*=lot_code]').type('Lot');
				cy.get('input[id*=revision]').type('Rev');
			});
			cy.get('.bin_details:nth-child(3)').within(() => {
				cy.get('select[id*=is_locked_]').select(['Locked']);
			});
			cy.get('.update_lot_data').first().click();
		});
		cy.wait('@update_lot_data');
		cy.wait(5000);
		cy.get(`[data-cy=MN] > tr.NEW`).then(row => {
			cy.wrap(row).within(() => {
				cy.get('span.alert').should('contain', 'LOCKED');
				cy.get('span[data-cy=NEW-date_code]').should('contain', 'Now');
				cy.get('span[data-cy=NEW-lot_code]').should('contain', 'Lot');
				cy.get('span[data-cy=NEW-revision]').should('contain', 'Rev');
			})
		});
	});


	it('Increases shelf quantity', function(){
		cy.visit('/')
		part.goto_prcpart(prcpart);
		inv.check_bin("MN", "NEW", 10, "$1.00").then(row => {
			cy.wrap(row).within(() => {
				cy.get("input[id*=bin_qty_]").focus().clear().type(20).blur();
				cy.get('select[id*=ia_code_]').select(['Miscount']);
				cy.get('input[id*=reason_text_]').type("Test Increase");
				cy.get('button[id*=update_]').click();
			});
		});
	});

	it('Decreases shelf quantity', function(){
		cy.visit('/')
		part.goto_prcpart(prcpart);
		inv.check_bin("MN", "NEW", 20, "$1.00").then(row => {
			cy.wrap(row).within(() => {
				cy.get("input[id*=bin_qty_]").focus().clear().type(15).blur();
				cy.get('select[id*=ia_code_]').select(['Miscount']);
				cy.get('input[id*=reason_text_]').type("Test Decrease");
				cy.get('button[id*=update_]').click();
			});
		});
	});

	it('Checks Relieve Inventory Log', function(){
		cy.visit('/')
		nav.main_menu('Parts', 'Reports', 'Inventory Activity');
		cy.get('.part_search').type(prcpart);
		cy.get('input[name=exact_prcpart]').check();
		cy.get('.button2').contains('Submit').click();
		assert.web_grid(
			'#activity_list_grid-partactivitylist', 
			[
				'tr:nth-child(1)', 
				'tr:nth-child(2)'
			], 
			[
				{
					'.Prcpart': prcpart.toUpperCase(),
					'.QtyChange': "-5",
					'.spanclassinlinehelpertiptitleThisistheinventoryvalueimpactofthisactivityInventoryValuespan ': "$-5.00",
					'.NewBinQty': "15",
					'.Reason': "Miscount",
					'.ReasonText': "Test Decrease",
				},
				{
					'.Prcpart': prcpart.toUpperCase(),
					'.QtyChange': "10",
					'.spanclassinlinehelpertiptitleThisistheinventoryvalueimpactofthisactivityInventoryValuespan ': "$10.00",
					'.NewBinQty': "20",
					'.Reason': "Miscount",
					'.ReasonText': "Test Increase",
				},
			]
		);
	});
});