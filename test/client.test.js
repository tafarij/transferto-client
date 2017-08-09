const test = require('tap').test;
const nock = require('nock');
const url = require('url');

const client = require('../')('fake-login', 'fake-token');
const successResponse = 'error_code=0\r\nerror_txt=success';

const createNock = () => {
    return nock('https://airtime.transferto.com')
        .get('/cgi-bin/shop/topup')
        .query(true);
};

test('sendRequest - should throw TransferToError when tt error_code is not 0', t => {
    const errorCode = '300';
    const errorTxt = 'Test message';
    const responseBody = `error_code=${errorCode}\r\nerror_txt=${errorTxt}`;

    createNock().reply(200, responseBody);

    client.sendRequest({foo: 'foo'})
        .catch(e => {
            t.equal(e.name, 'TransfertoError');
            t.equal(e.message, errorTxt);
            t.equal(e.code, errorCode);
            t.end();
        });
});

test('sendRequest - should send its args as query params', t => {
    const action = 'pricelist';
    const infoType = 'countries';

    createNock()
        .reply(200, uri => {
            const query = url.parse(uri, true).query;

            t.ok(query.md5);
            t.equal(query.action, action);
            t.equal(query.info_type, infoType);

            return successResponse;
        });

    client.sendRequest({ action, info_type: infoType })
        .then(_ => t.end());
});

test('sendRequest - should parse comma separated values to json array', t => {
    const expectedFoo = ['1', '2', '3', '4', '5'];
    const excluded = {
        promotion: 'this, should not split, ever',
        sms: 'sms, should, not split to array',
        infotText: 'this neither, it really should not'
    };

    const response = [
        'foo=1,2,3,4,5',
        `promotion=${excluded.promotion}`,
        `sms=${excluded.sms}`,
        `info_txt=${excluded.infotText}`,
        successResponse
    ].join('\r\n');

    createNock().reply(200, response);

    client.sendRequest({ bar: 'bar' })
        .then(data => {
            t.ok(data.foo);
            t.same(data.foo, expectedFoo);
            t.same(data.promotion, excluded.promotion);
            t.same(data.sms, excluded.sms);
            t.same(data.info_txt, excluded.infotText);
            t.end();
        });
});

test('getCountries', t => {
    createNock()
        .reply(200, uri => {
            const query = url.parse(uri, true).query;

            t.equal(query.action, 'pricelist');
            t.equal(query.info_type, 'countries');

            return successResponse;
        });

    client.getCountries()
        .then(_ => t.end());
});

test('getCountry', t => {
    createNock()
        .reply(200, uri => {
            const query = url.parse(uri, true).query;

            t.equal(query.action, 'pricelist');
            t.equal(query.info_type, 'country');

            return successResponse;
        });

    client.getCountry()
        .then(_ => t.end());
});

test('getOperator', t => {
    const operatorId = '321';

    createNock()
        .reply(200, uri => {
            const query = url.parse(uri, true).query;

            t.equal(query.action, 'pricelist');
            t.equal(query.info_type, 'operator');
            t.equal(query.content, operatorId);

            return successResponse;
        });

    client.getOperator(operatorId)
        .then(_ => t.end());
});

test('getMsisdnInfo - with no options', t => {
    const msisdn = '18765555555';

    createNock()
        .reply(200, uri => {
            const query = url.parse(uri, true).query;

            t.equal(query.action, 'msisdn_info');
            t.equal(query.destination_msisdn, msisdn);
            t.equal(query.delivered_amount_info, '1');
            t.equal(query.return_service_fee, '1');
            t.equal(query.return_promo, '1');
            t.equal(query.currency, 'USD');

            return successResponse;
        });

    client.getMsisdnInfo(msisdn)
        .then(_ => t.end());
});

test('getMsisdnInfo - with options', t => {
    const msisdn = '18765555555';
    const options = {
        delivered_amount_info: '0',
        return_service_fee: '0',
        currency: 'JMD',
        return_promo: '0',
        destination_msisdn: 'should-not-overwrite',
        action: 'should-not-overwrite'
    };

    createNock()
        .reply(200, uri => {
            const query = url.parse(uri, true).query;

            t.equal(query.action, 'msisdn_info');
            t.equal(query.destination_msisdn, msisdn);
            t.equal(query.delivered_amount_info, options.delivered_amount_info);
            t.equal(query.return_service_fee, options.return_service_fee);
            t.equal(query.return_promo, options.return_promo);
            t.equal(query.currency, options.currency);

            return successResponse;
        });

    client.getMsisdnInfo(msisdn, options)
        .then(_ => t.end());
});

test('topup', t => {
    const topupData = {
        destination_msisdn: '18765555555',
        msisdn: '19545555555',
        operatorid: '123',
        skuid: '456',
        product: '15',
        sms: 'whaddup?!'
    };

    createNock()
        .reply(200, uri => {
            const query = url.parse(uri, true).query;

            t.equal(query.action, 'topup');
            t.equal(query.destination_msisdn, topupData.destination_msisdn);
            t.equal(query.msisdn, topupData.msisdn);
            t.equal(query.operatorid, topupData.operatorid);
            t.equal(query.skuid, topupData.skuid);
            t.equal(query.product, topupData.product);
            t.equal(query.sms, topupData.sms);
            t.equal(query.currency, 'USD');
            t.equal(query.delivered_amount_info, '1');
            t.equal(query.return_service_fee, '1');
            t.equal(query.return_promo, '1');

            return successResponse;
        });

    client.topup(topupData)
        .then(_ => t.end());
});

test('topup - simulation and currency', t => {
    const topupData = {
        simulate: true,
        currency: 'JMD',
        destination_msisdn: '18765555555',
        msisdn: '19545555555',
        operatorid: '123',
        skuid: '456',
        product: '15',
        sms: 'whaddup?!'
    };

    createNock()
        .reply(200, uri => {
            const query = url.parse(uri, true).query;

            t.equal(query.action, 'simulation');
            t.equal(query.currency, topupData.currency);

            return successResponse;
        });

    client.topup(topupData)
        .then(_ => t.end());
});

// SPREADS
test('getCountries - spreads', t => {
    createNock()
        .reply(200, uri => {
            const query = url.parse(uri, true).query;

            t.equal(query.action, 'pricelist');
            t.equal(query.info_type, 'countries');

            return successResponse;
        });

    const { getCountries } = client;
    getCountries()
        .then(_ => t.end())
        .catch(t.threw);
});
