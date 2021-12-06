import Nav from '../utils/navigation';
import Quote from '../utils/quotes';
import Assertion from '../utils/assertions';

describe('Order Merge', function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });
    const nav    = new Nav();
    const assert = new Assertion();
    const quote  = new Quote();

    const ending = "PRT Ending Part";
    const boms = new Map()
    boms.set('BOM TOP', ['BOM Right', 'BOM Middle', 'BOM Left']) 
    boms.set('BOM Right', ['BOM Right Right', 'BOM Right Middle', 'BOM Right Left']) 
    boms.set('BOM Middle', ['BOM Middle Right', 'BOM Middle Middle', 'BOM Middle Left']) 
    boms.set('BOM Left', ['BOM Left Right', 'BOM Left Middle', 'BOM Left Left']) 
    boms.set('BOM Middle Right', ['BOM Middle Right Lower']) 
    boms.set('BOM Middle Right Lower', ['BOM Middle Right Lower Right', 'BOM Middle Right Lower Middle', 'BOM Middle Right Lower Left']) 
    boms.set('BOM Right Right', [ending])
    boms.set('BOM Right Middle', [ending])
    boms.set('BOM Right Left', [ending])
    boms.set("BOM Middle Middle",[ending])
    boms.set("BOM Middle Left", [ending])
    boms.set("BOM Left Right", [ending])
    boms.set("BOM Left Middle", [ending])
    boms.set("BOM Left Left", [ending])
    boms.set('BOM Middle Right Lower Right',  [ending])
    boms.set('BOM Middle Right Lower Middle', [ending])
    boms.set('BOM Middle Right Lower Left', [ending])

    const bom_keys = [] 
    for(let key of boms.keys()){
        bom_keys.push(key)
    }

    it('Creates A Large MultiLevel Bom', function(){
        //check to see if it exists first
        cy.request({
            method: 'GET',
            url: "/api/part/BOM%20TOP?preshared_token=cypress_api_hack",
            failOnStatusCode: false,
        }).then(function(res){
            cy.wrap(res.status).as('status')
        }).then(function(){
            let enc_prcpart = encodeURIComponent(ending);
            let enc_desc    = encodeURIComponent('ending part');
            cy.request({
                method: 'PUT',
                url: `/api/part?preshared_token=cypress_api_hack&prcpart=${enc_prcpart}&description=${enc_desc}`,
                failOnStatusCode: false,
            });
               
            cy.wrap(bom_keys).each((bom, idx) => {
                enc_prcpart = encodeURIComponent(bom);
                enc_desc    = encodeURIComponent('Some Boms');
                cy.request({
                    method: 'PUT',
                    url: `/api/part?preshared_token=cypress_api_hack&prcpart=${enc_prcpart}&description=${enc_desc}`,
                    // failOnStatusCode: false,
                });
                cy.handle_exception(); //command.js file
                cy.visit(`/part/part_view?prcpart=${bom}`);
                nav.side_menu('Edit')
                nav.get('body','.button2','Create As BOM');
                cy.on('window:confirm', cy.stub());
                let stop = 0;
                cy.wrap(boms.get(bom)).each(item => {
                    enc_prcpart = encodeURIComponent(item)
                    cy.request({
                        method: 'PUT',
                        url: `/api/part?preshared_token=cypress_api_hack&prcpart=${enc_prcpart}&description=${enc_desc}`,
                        // failOnStatusCode: false,
                    });
                    if(idx == 0 && stop == 0){
                        stop = 1;
                        cy.get('.kinda_show_grid_control').click();
                        cy.get(`#web_grid_control_bom_edit_table`).within($control => {
                            cy.get("input[type='radio']").each((box, i) => {
                                if(i == 0 || i % 2 == 0){
                                    cy.get(box).click();
                                }
                            });
                        });               
                        cy.get('#cboxClose').click();
                    }
                    cy.get('#new_prcpart').type(item);
                    cy.get('#new_qty_per_top').clear().type(1);
                    nav.get('body','.button2','Update');
                });
            })
        });
    });

    const names = ['from_order', 'to_order'];
    it('Creates Some Orders to Merge', function(){
        for(let i = 0; i < 2; i++){
            let lines = [{prcpart: 'BOM TOP', transcode: 'build', use_add_line_button: 1}];
            quote.new_order(lines,'',1);
            cy.get_quote_po_or_order_num(names[i], '', 1)//store the ids in session storage
        }
    });

    const from_order_map = {};
    const to_order_map = {};
    const order_maps = [from_order_map, to_order_map];
    const levels = {
        "padding-left:5px;"  : 1, 
        "padding-left:25px;" : 2, 
        "padding-left:50px;" : 3, 
        "padding-left:75px;" : 4, 
        "padding-left:100px;": 5
    };

    it("Merges the orders", function(){
        cy.window().then($win => {
            let from_order = $win.sessionStorage.getItem('from_order');
            let to_order = $win.sessionStorage.getItem('to_order');
            cy.visit('order/' + from_order +'/view');
            cy.wrap(from_order).as('from_order');
            cy.wrap(to_order).as('to_order');
        }).then(() => {
            nav.side_menu('Merge')
            let helper = [] //use this to build the maps;
            let ordernum;
            cy.get('#ordernum').type(this.to_order);
            cy.get('#search').click();
            for(let i = 0; i < names.length; i++){
                cy.get('#' + names[i]).within(() => {
                    cy.get('tbody > tr').each((tr,index, trs) => {
                        cy.get(tr).within(() => {
                            cy.get('td').each((td, idx) => {
                                if(idx == 0){
                                    cy.wrap(td).find('a').then(a => {
                                        ordernum = a.text();
                                        ordernum = ordernum.replace(/^\s*/g, '');
                                        ordernum = ordernum.replace(/\s*$/g, '');
                                        helper.push(ordernum);
                                    });
                                }else if(idx == 1){
                                    cy.wrap(td).then(it => {
                                        let style = it.attr('style');
                                        var level = levels[style];
                                        helper.push(level);
                                    });
                                }else if(idx == 4){
                                    cy.wrap(td).find('a').then(a => {
                                        let prcpart = a.text();
                                        prcpart = prcpart.replace(/^\s*/g, '');
                                        prcpart = prcpart.replace(/\s*$/g, '');
                                        helper.push(prcpart);
                                    });
                                }
                                order_maps[i][helper[0]] = {level: helper[1], prcpart: helper[2]};
                                helper = [];
                            })
                        });
                    });
                    //weird -- it was't getting the last order
                    cy.get('tbody > tr').last().within(tr => {
                        cy.get('td').each((td, idx) => {
                            if(idx == 0){
                                cy.wrap(td).find('a').then(a => {
                                    ordernum = a.text();
                                    ordernum = ordernum.replace(/^\s*/g, '');
                                    ordernum = ordernum.replace(/\s*$/g, '');
                                    helper.push(ordernum);
                                });
                            }else if(idx == 1){
                                cy.wrap(td).then(it => {
                                    let style = it.attr('style');
                                    var level = levels[style];
                                    helper.push(level);
                                });
                            }else if(idx == 4){
                                cy.wrap(td).find('a').then(a => {
                                    let prcpart = a.text();
                                    prcpart = prcpart.replace(/^\s*/g, '');
                                    prcpart = prcpart.replace(/\s*$/g, '');
                                    helper.push(prcpart);
                                });
                            }
                            order_maps[i][helper[0]] = {level: helper[1], prcpart: helper[2]};
                        })
                    })
                }).then(() => {
                    delete order_maps[i][undefined]// removes the accidental entry
                    helper = []
                });
            }
        });
        cy.get('#merge').click();
    });
    
    it('Asserts the merged order', function(){
        assert.success();
        nav.side_menu('Related Orders');
        cy.window().then($win => {
            let from = Object.keys(from_order_map);
            let to   = Object.keys(to_order_map);
            from     = from[0];
            to       = to[0];
            const from_ordnum = from.replace(/\.1/g, '');
            const to_ordnum   = to.replace(/\.1/g, '');
            cy.get('#related_orders').within(() => {
                cy.get('tbody > tr').each((tr, i) => {
                    if(i == 1){
                        cy.get(tr).within(() => {
                            cy.get('td').each((td, idx) => {
                                if(idx == 1){
                                    cy.wrap(td).then(it => {
                                        let lineitem = it.text();
                                        lineitem     = lineitem.replace(/^\s*/g, '');
                                        lineitem     = lineitem.replace(/\s*$/g, '');
                                        cy.wrap(lineitem).should('eq', "2");
                                    });
                                }
                                if(idx == 4){
                                    cy.wrap(td).find('a').then(a => {
                                        let prcpart = a.text();
                                        prcpart = prcpart.replace(/^\s*/g, '');
                                        prcpart = prcpart.replace(/\s*$/g, '');
                                        cy.wrap(prcpart).should('eq', 'BOM TOP');
                                    });
                                }
                            });
                        });
                    }else{
                        let ordernum;
                        let correct_map;
                        let correct_key;
                        cy.get(tr).within(() => {
                            cy.get('td').each((td, idx) => {
                                if(idx == 0 ){
                                    ordernum    = td.text();
                                    ordernum    = ordernum.replace(/^\s*/g, '');
                                    ordernum    = ordernum.replace(/\s*$/g, '');
                                    correct_key = ordernum;
                                    ordernum    = ordernum.replace(/\.\d*/g, '')
                                    if(ordernum == from_ordnum){
                                        correct_map = from_order_map;
                                    }else{
                                        correct_map = to_order_map;
                                    }
                                }
                                if(idx == 1){
                                    cy.wrap(td).then(it => {
                                        let style = it.attr('style');
                                        var level = levels[style];
                                        cy.wrap(correct_map[correct_key].level).should('eq', level);
                                    });
                                }
                                if(idx == 4){
                                    cy.wrap(td).find('a').then(a => {
                                        let prcpart = a.text();
                                        prcpart = prcpart.replace(/^\s*/g, '');
                                        prcpart = prcpart.replace(/\s*$/g, '');
                                        cy.wrap(correct_map[correct_key].prcpart).should('eq', prcpart);
                                    });
                                }
                            });
                        });
                    }
                });
            });
        });
    });
});
