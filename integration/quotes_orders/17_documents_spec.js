import 'cypress-file-upload';
import Navigation from '../../utils/navigation';

describe('Documents', function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
        Cypress.on("uncaught:exception", (err, runnable) => {
			return false;
		});
    });

    var nav   = new Navigation();
    var moment = require("moment");
    var Blob = require('blob-util')
   
    it('Creates a Quote then Adds Documents', function(){
        cy.visit('quote/create_quote')
        nav.side_menu('Documents')
        for(let i = 0; i < 15; i++){

            cy.window().then(win => {
                var urls = win.location.pathname
                var quote = urls.replace(/quote/g, '');
                var doc = quote.replace(/documents/g, '');
                var quote_id = Number(doc.replace(/\//g, ''));
                var fileName = 'assets/upload_file.json';
                var method = 'PUT';
                var url = `/api/document?preshared_token=cypress_api_hack&object_id=${quote_id}&object_type=Quote&name=upload_file_${moment().format("hh:mm:ss")}`;
                var fileType = 'application/json';
                cy.fixture(fileName, 'binary').then( (file) => {
                    cy.wrap(Blob.binaryStringToBlob(file, fileType)).then((blob) => {
                        var formData = new FormData();
                        formData.set('file', blob, fileName); //adding a file to the form
                        cy.form_request(method, url, formData, function (response) {
                            expect(response.status).to.eq(201);
                        });
                        
                    });
                });
            });
            cy.log('Uploaded file ' + (i + 1))
            cy.wait(1000)
        }
        cy.reload()
        cy.wait(5000)
        cy.get('#DataTables_Table_0 > tbody').within(() => {
            cy.get('tr').should('have.length', 10)
            cy.log('There are 10 files on the first page')
        });
        cy.get('.paginate_button').last().click()
        cy.wait(3000)
        cy.get('#DataTables_Table_0 > tbody').within(() => {
            cy.get('tr').should('have.length', 5)
            cy.log('There are 5 files on the last page')
        });
    });

    it('Globalize Document to Quote Object', function(){
        cy.get('.make_global').first().click()
        cy.wait(3000)
        cy.visit('quote/create_quote')
        nav.side_menu('Documents')
        cy.wait(3000)
        cy.get('#DataTables_Table_0 > tbody').within(() => {
            cy.get('tr').should('have.length', 1)
            cy.log('There should be 1 globalized file on this page')
            cy.get('.unmake_global').first().should('contain', "Localize")
        });
    });
});


