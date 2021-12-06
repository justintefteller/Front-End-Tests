import General from '../utils/general'
import Navigation from '../utils/navigation'
import 'cypress-file-upload';
import Assertion from '../utils/assertions';
import Part from '../utils/part';
var gen = new General();
var nav = new Navigation();
var part = new Part();
var assert = new Assertion();
var [today,tomorrow] = gen.dates();

describe('NCR and CAR', function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });

    var prcpart = 'PRTNCRANDCARTEST';
    var desc    = 'ncr and car test';
    var token   = 'cypress_api_hack';
    const input_names = 
        {
            ncr: {
                skip : [
                    "textfield","transition","update_workflow_assignment",
                    "workflow_comments","workflow_cc_list","update_workflow_cc_list",
                    "update_workflow_priority","new_order_line","customer_id","po", "picture"
                    ],
                select: {
                    "ncr_type": ['Customer Complaint (External)'],
                    "department": ['At Vendor Outsourcing']
                },
                type: {
                    "title":"NCR Test",
                    "customer_name":'ABC Inc.',
                    "prcpart":prcpart,
                    "vendor":'Stuff And More',
                    "duedate": tomorrow,
                    "quantity":1,
                },
                check: {
                    "critical":'check'
                },
                iframe: 'Testing the NCR'
            }
        }

    it("Creates a specific part for this test", function() {
        part.create_prcpart_with_api(token, prcpart, desc)
        part.receives_stock_from_api(prcpart)
    });

    it("Creates a NCR and CAR from scratch", function () {
        var links = ["ncr", "car"];
        for (let i = 0; i < links.length; i++) {
            cy.visit(`/otd/${links[i]}/list`);
            nav.get("body", ".button", "Create");
            cy.get(`#${links[i]}_creation:visible`).within($this => {
                nav.get($this, ".button2", "Create");
            });
            cy.get(".status_message").should("contain", `${links[i].toUpperCase()} Created`);
            cy.window().then($win => {
                $win.sessionStorage.setItem(`${links[i]}_link`, $win.location.pathname);
            })
        }
    });

    it('Checks the render', function(){
        cy.window().then($win => {
            cy.visit($win.sessionStorage.getItem('ncr_link'))
        });
        cy.wrap(input_names.ncr.skip).each((input, idx) => {
            cy.wrap(`input[name="${input}"]`).should('exist')
        });
        Object.keys(input_names.ncr.select).forEach(select => {
            cy.wrap(`select[name="${select}"]`).should('exist')
        });
        Object.keys(input_names.ncr.type).forEach(type => {
            cy.wrap(`input[name="${type}"]`).should('exist')
        });
        Object.keys(input_names.ncr.check).forEach(check => {
            cy.wrap(`input[name="${check}"]`).should('exist')
        });
        cy.get('.jHtmlArea').each(function (area){
            cy.wrap(area).should('exist')
        });
    });

    it('Updates NCR', function(){
        Object.keys(input_names.ncr.type).forEach(key => {
            if(key == 'customer_name'){
                cy.get(`input[name="${key}"]`).type(input_names.ncr.type[key])
                nav.get_dropdown(input_names.ncr.type[key])
            } else {
                cy.get(`input[name="${key}"]`).last().focus().clear().type(input_names.ncr.type[key]).blur()
            }
        });
        Object.keys(input_names.ncr.select).forEach(key => {
            cy.get(`select[name="${key}"]`).select(input_names.ncr.select[key])
        });

        Object.keys(input_names.ncr.check).forEach(key => {
            cy.get(`input[name="${key}"]`).check()
        });
        //this doesn't work.. boo
        // cy.get('iframe').each(frame => {
        //    cy.wrap(frame).click().type(input_names.ncr.iframe)
        // });
    });

    it('Uploads a photo', function(){
        cy.fixture('assets/upload_photo.jpg').then(fileContent => {
            cy.get('input[type="file"]').attachFile({
                fileContent: fileContent.toString(),
                fileName: 'assets/upload_photo.jpg',
                mimeType: 'image/jpg'
            });
        });
        nav.get('body', '.button2', 'Update')
        cy.get('.image_popup_link').should('have.length', 1)
    });

    it("Makes Sure Update Committed", function(){
        cy.get('body').find('td').contains('CRITICAL').should('have.css', 'background-color','rgb(255, 0, 0)')
        cy.get('select[name="ncr_type"]').should('have.value', 3)
        Object.keys(input_names.ncr.type).forEach(type => {
            cy.get(`input[name="${type}"]`).last().should('have.value', input_names.ncr.type[type])
        });
        Object.keys(input_names.ncr.check).forEach(check => {
            cy.get(`input[name="${check}"]`).should('be.checked')
        });
    });

    const print_assert = [
        ["For Customer " + input_names.ncr.type.customer_name],
        ["NCR Type:","Customer Complaint",	"Initiated By:","techx", today],
        ["Order/Line:",	"Prcpart:",prcpart, `(Qty: ${input_names.ncr.type.quantity})`],
        ["Assigned To:", "techx"],
        ["Source:",	"Independent", "Vendor:", input_names.ncr.type.vendor],
        ["Details"],
        ["Non-Conformance Details"],
        ["Containment"],
    ];

    it('Checks Printable', function(){
        cy.window().then($win => {
            var url = $win.sessionStorage.getItem('ncr_link');
            var new_url = url.replace(/edit/,'print');
            cy.visit(new_url)
        });
        cy.get('table').last().within((table) => {
            cy.get('tr').each((tr, idx) => {
                cy.wrap(print_assert[idx]).each(assert => {
                    cy.wrap(tr).should('contain',assert)
                });
            });
        });
    });
    it('Checks PDF', function(){
        cy.window().then($win => {
            var url = $win.sessionStorage.getItem('ncr_link');
            var new_url = url.replace(/edit/,'pdf');
            cy.visit(new_url)
        });
        cy.get('table').last().within((table) => {
            cy.get('tr').each((tr, idx) => {
                cy.wrap(print_assert[idx]).each(assert => {
                    cy.wrap(tr).should('contain',assert)
                });
            });
        });
    });

    it('Deletes the NCR', function(){
        cy.window().then($win => {
            var url = $win.sessionStorage.getItem('ncr_link');
            cy.visit(url)
        });
        nav.get('body','.button', 'Delete')
        cy.get('.status_message').should('contain', 'Deleted')
    })
});


