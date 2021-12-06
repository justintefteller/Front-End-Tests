import Navigation from '../utils/navigation';
import Data_Maint from '../utils/data_maint';

describe('Data Maint Tab', function () {
    const nav = new Navigation();
    const dm  = new Data_Maint();
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });

    it('Get All Tables and Save into Env Variable', function(){
        var urls = {};
        cy.visit('/tablemaint/list')
        cy.get("#grid-tablemaintlist").find('a').each($a => {
            var key = $a.text()
            var value = $a.attr('href').match(/\/tablemaint\/.*\/edit/)
            urls[key] = value[0]
        }).then(() => {
            for(let url in urls){
                if(url == "AddressCountry"){
                    // dm.address_country(urls[url])
                } else if(urls[url] == "/tablemaint/DiscountType/edit"){
                    dm.data_maint_entry(urls[url],'/',".name", 'special discount')
                } else if(urls[url] == "/tablemaint/SHPCE/edit" || urls[url] == "/tablemaint/WorkflowStage/edit" ||  urls[url] == "/tablemaint/ExpenseLogEntryType/edit" || urls[url] == '/tablemaint/ExpenseLogPaymentType/edit' || urls[url] == '/tablemaint/SystemControlType/edit' || urls[url] == '/tablemaint/SHPCDE/edit' || urls[url] == '/tablemaint/CurrencyRate/edit' || urls[url] == '/tablemaint/ExternalSource/edit' || urls[url] == '/tablemaint/OSHIPG/edit' ||urls[url] == '/tablemaint/OpportunityType/edit' ||urls[url] == '/tablemaint/RentalChargeReason/edit' || urls[url] == '/tablemaint/RentalFailureType/edit' || urls[url] == '/tablemaint/SystemControlType/edit' || urls[url] == '/tablemaint/UOM/edit' ){
                    cy.log('skipping for now')
                } else{
                    cy.log('skipping for now')
                    // dm.add_record(urls[url])   
                }
            }
        })
    });
});

