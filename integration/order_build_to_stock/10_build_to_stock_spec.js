//log
//moved this to another folder
//changed new_order to accept intenal account
//make sure assert webgrid is there
//order.js file
import Navigation from "../../utils/navigation";
import Assertion from "../../utils/assertions";
import General from '../../utils/general';
import Quotes from '../../utils/quotes';
import Orders from '../../utils/orders';
import Part from '../../utils/part';

describe("Build to Stock with Subs", function () {
    const nav   = new Navigation(),
        assert  = new Assertion(),
        part    = new Part(),
        quote   = new Quotes(),
        order   = new Orders(),
        moment  = require("moment"),
        today2  = moment().format("YYYY-MM-DD");

    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });

    const topPart = "BOMOrderBuild", sub1 = "SUBABC",
        sub2 = "SUBDEF", prt1 = 'PRTUnderABC', prt2 = "PRTUnderDEF";

    it("Makes a BOM with Subs", function(){
        //might be an easier way of doing it but at least it's fast
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

    it("Receives enough parts to make sure it doesnt run out", function () {
        part.receives_stock_from_api([prt1, prt2], 100)
    });

    it("Creates an Order with Subs", function(){
        const build = 'BUILD', lines = [{prcpart: topPart, qty: 10, transcode: build, cost: 0, resale: 0 }];
        quote.new_order(lines, '', build, 'Yes');
    });

    it('Completes and Receives SubOrder 1', function(){
        cy.window().then(win => {
            let order_num      = win.location.pathname.match(/MN\d+\.\d+/)[0],
                sub_order_num1 = win.location.pathname.match(/MN\d+\.\d+/)[0].replace(/\.\d+/, ".2"),
                sub_order_num2 = win.location.pathname.match(/MN\d+\.\d+/)[0].replace(/\.\d+/, ".3");

            win.sessionStorage.setItem('order_num', order_num);
            win.sessionStorage.setItem('sub_order_num1', sub_order_num1)
            win.sessionStorage.setItem('sub_order_num2', sub_order_num2);
            cy.wrap(sub_order_num1).as('sub_order_num1');
        }).then(function(){
            cy.visit(`/order/${this.sub_order_num1}/view`);
            assert.web_grid(
                '#open-order-lines', 
                [
                    'tr:nth-child(1)', 
                ], 
                [
                    {
                        '.balance_due': "10",
                        '.transcode ': "Build",
                        '.prcpart': sub1,
                        '.ext_cost': '$0.00',
                        '.ext_resale': '$0.00',
                    },
                ]
            )
        });
        nav.side_menu('Workorder View');
        nav.side_menu('Line 1');
        order.log_work('', [100, 0]);
        nav.side_menu('Pick Parts')
        cy.get('.pick_all').last().click();
        assert.web_grid(
            '#header_data', 
            [
                'tr:nth-child(1)', 
            ], 
            [
                {
                    '.qty_picked': "10",
                },
            ]
        );
        cy.get('.button2').last().click();
        nav.side_menu('Complete/Receive');
        cy.get('#order-lines > tbody > tr#line_1')
            .find('input[type=number]').clear().focus().type(10).blur();
        cy.get('#create_invoice').click();
        cy.wait(3000);
        assert.success('Material Completed/Received');
    });

    it('Completes and Receives SubOrder 2', function(){
        cy.window().then(win => {
            cy.wrap(win.sessionStorage.getItem('sub_order_num2')).as('sub_order_num2');
        }).then(function(){
            cy.visit(`/order/${this.sub_order_num2}/view`);
            assert.web_grid(
                '#open-order-lines', 
                [
                    'tr:nth-child(1)', 
                ], 
                [
                    {
                        '.balance_due': "20",
                        '.transcode ': "Build",
                        '.prcpart': sub2,
                        '.ext_cost': '$0.00',
                        '.ext_resale': '$0.00',
                    },
                ]
            );
            nav.side_menu('Workorder View');
            nav.side_menu('Line 1');
            order.log_work('', [100, 0]);
            nav.side_menu('Pick Parts')
            cy.get('.pick_all').last().click();
            assert.web_grid(
                '#header_data', 
                [
                    'tr:nth-child(1)', 
                ], 
                [
                    {
                        '.qty_picked': "20",
                    },
                ]
            );
            cy.get('.button2').last().click();
            nav.side_menu('Complete/Receive');
            cy.get('#order-lines > tbody > tr#line_1')
                .find('input[type=number]').clear().focus().type(20).blur();
            cy.get('#create_invoice').click();
            cy.wait(3000);
            assert.success('Material Completed/Received');
        });
    });

    it('Completes and Receives the Top Order', function(){
        cy.window().then(win => {
            cy.wrap(win.sessionStorage.getItem('order_num')).as('topOrder');
        }).then(function(){
            cy.visit(`/order/${this.topOrder}/view`);
            assert.web_grid(
                '#open-order-lines', 
                [
                    'tr:nth-child(1)', 
                ], 
                [
                    {
                        '.balance_due': "10",
                        '.transcode ': "Build",
                        '.prcpart': topPart.toUpperCase(),
                    },
                ]
            );
            nav.side_menu('Workorder View');
            nav.side_menu('Line 1');
            nav.side_menu('Pick Parts')
            cy.get('.pick_all').last().click();
            assert.web_grid(
                '#header_data', 
                [
                    'tr:nth-child(1)', 
                    'tr:nth-child(2)', 
                ], 
                [
                    {
                        '.qty_picked': "10",
                    },
                    {
                        '.qty_picked': "20",
                    },
                ]
            );
            cy.get('.button2').last().click();
            nav.side_menu('Complete/Receive');
            cy.get('#order-lines > tbody > tr#line_1')
                .find('input[type=number]').clear().focus().type(10).blur();
            cy.get('#create_invoice').click();
            cy.wait(3000);
            assert.success('Material Completed/Received');
        });
    });
 
});
