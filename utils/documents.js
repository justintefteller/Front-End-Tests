import 'cypress-file-upload';

class Documents {
    upload_document = (fileName, obj_id, obj_type, fileType) => {
        const Blob = require('blob-util'),
            moment = require("moment"),
            url = `/api/document?preshared_token=cypress_api_hack&object_id=${obj_id}&object_type=${obj_type}&name=upload_file_${moment().format("hh:mm:ss")}`;
        cy.fixture(fileName, 'binary').then( (file) => {
            cy.wrap(Blob.binaryStringToBlob(file, fileType)).then((blob) => {
                var formData = new FormData();
                formData.set('file', blob, fileName); //adding a file to the form
                cy.form_request('PUT', url, formData, function (response) {
                    expect(response.status).to.eq(201);
                });
                
            });
        });
    }
}

export default Documents;