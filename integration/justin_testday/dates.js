import General from '../utils/general';
describe('', function () {
    beforeEach(() => {
        cy.login();
        cy.viewport(1200, 700);
    });
    it('fuck off', () => {
        var gen = new General();
        var moment = require('moment')
        var that = moment().add( 30, 'minutes').minute()
        console.log(that)
        
        var [today,futureDate, tomorrow] = gen.dates();
        console.log(tomorrow)

    })
});