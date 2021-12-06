import Navigation from '../utils/navigation';
import Assertion from '../utils/assertions';
import Quotes from '../utils/quotes';
import General from '../utils/general';
import Part from '../utils/part';

describe('Quote Tab', function () {
    beforeEach(() => {
        cy.login();
    });
    var nav = new Navigation();
    var assert = new Assertion();
    var quote = new Quotes();
    var gen = new General();
    var part = new Part();

    var info = gen.info(7);
    var prcpart = `PRT${gen.info(7)}`;

    var [today, futureDate] = gen.dates();
    var moment = require('moment');

    it('Makes some orders for my lazy ass', function(){
        var line1 = [{prcpart: 'BOM3', qty: '1', resale: '100', cost: 10, transcode: 'SA'}]
        var line2 = [{prcpart: 'BOM1', qty: '1', resale: '100', cost: 10, transcode: 'SA'}]
        quote.new_order(line1)
        quote.new_order(line2)
    });
})
