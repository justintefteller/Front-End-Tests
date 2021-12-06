describe('', function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });
    it('builds a bom', function(){
       var bom = new Map();
       bom.set('BOM Yep1', ['PRT Hello'])
        const create_part = (part) => {
            var is_bom = '&create_fixbom=1';
            const enc_part = encodeURIComponent(part)
            const enc_desc = encodeURIComponent('Some Boms');
            let part_created = false
            cy.request({
                method: 'GET',
                url: `/api/part/${enc_part}?preshared_token=cypress_api_hack`,
                failOnStatusCode: false,
            }).then(function(res){
                if(res.status != 200){
                cy.request({
                        method: 'PUT',
                        url: `/api/part?preshared_token=cypress_api_hack&prcpart=${enc_part}&description=${enc_desc}${is_bom}`,
                    });
                    part_created = true
                }
            });
            return part_created
        }
        create_part('BOM Yep3')
        cy.visit('/')
    });
});