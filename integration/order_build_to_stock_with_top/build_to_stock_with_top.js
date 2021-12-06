import Navigation from '../../utils/navigation';
import Assertion from '../../utils/assertions';
import Part from '../../utils/part';
import Quote from '../../utils/quotes';
import Order from '../../utils/orders';

describe("The Order Entry Build", function () {
    const nav   = new Navigation(),
        assert  = new Assertion(),
        part    = new Part(),
        order   = new Order(),
        quote   = new Quote();

    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });

    const topPart = "BOMORDERBUILDWITHTOP", sub1 = "SUBTOP1",
        sub2 = "SUBTOP2", prt1 = 'PRTUnderTOP1', prt2 = "PRTUnderTOP2";

    it("Makes a BOM", function(){
		const jsonTop = {
            prcpart: topPart,
            revision_text: 'A',
            bom_definition: [
                {
                    prcpart: sub1,
                    component: '1',
                    revision_text: 'A',
                    qty_per_top: '1',
                },
                {
                    prcpart: sub2,
                    component: '2',
                    revision_text: 'A',
                    qty_per_top: '2',
                },

            ],
        };
        const jsonSub1 = {
            prcpart: sub1,
            revision_text: 'A',
            bom_definition: [
                {
                    prcpart: prt1,
                    component: '1',
                    revision_text: '',
                    qty_per_top: '1',
                },
            ],
        };
        const jsonSub2 = {
            prcpart: sub2,
            revision_text: 'A',
            bom_definition: [
                {
                    prcpart: prt2,
                    component: '1',
                    revision_text: '',
                    qty_per_top: '1',
                },
            ],
        };
        cy.request({
            method: 'GET',
            url:`/api/part/${jsonTop.prcpart}?preshared_token=cypress_api_hack`,
            failOnStatusCode: false,
        }).then((res) => {
            if(!res.body.prcpart){
                cy.request({
                    method: 'POST',
                    url:"/api/partrevisiondefinition?preshared_token=cypress_api_hack",
                    body: JSON.stringify(jsonTop),
                    headers: {"Version": "2.0"},
                    failOnStatusCode: true,
                }).then(() => {
                    Promise.all([
                        cy.request({
                            method: 'POST',
                            url:"/api/partrevisiondefinition?preshared_token=cypress_api_hack",
                            body: JSON.stringify(jsonSub1),
                            headers: {"Version": "2.0"},
                            failOnStatusCode: true,
                        }),
                        cy.request({
                            method: 'POST',
                            url:"/api/partrevisiondefinition?preshared_token=cypress_api_hack",
                            body: JSON.stringify(jsonSub2),
                            headers: {"Version": "2.0"},
                            failOnStatusCode: true,
                        }),
                    ]);
                })
            }
        });


    });

    it("Receives enough parts to make sure it doesn't run out", function () {
        part.receives_stock_from_api([prt1, prt2, sub1, sub2], 100)
    });

    it("Creates a New Build Order with Top", function () {
        quote.new_order([{prcpart: topPart, transcode: 'SA' }], '', 'with top', 1);
        cy.get(".table_show_hide_touched").contains("Build");
    });

	//todo
	// it("Validates the parts and labor plan", function(){
	// });

	it('Completes and Receives the Order', function(){
		nav.side_menu('Workorder View');
		nav.side_menu('Line 1');
        order.log_work('', [100, 0]);
		nav.side_menu('Complete/Receive');
		cy.get('.pick_everything ').check();
		cy.get('.fill_labor').check();
		cy.get('body').find('.button2').contains('Update').click();
		cy.get('#order-lines > tbody > tr#line_1')
			.find('input[type=number]').clear().focus().type(10).blur();
		cy.get('#create_invoice').click();
		cy.wait(3000);
		assert.success('Material Completed/Received');
	});
});

