# transferto-client

[![Build Status](https://travis-ci.org/tafarij/transferto-client.svg?branch=master)](https://travis-ci.org/tafarij/transferto-client)
[![Coverage Status](https://coveralls.io/repos/github/tafarij/transferto-client/badge.svg?branch=master)](https://coveralls.io/github/tafarij/transferto-client?branch=master)

This is a simple node.js wrapper around the transfer-to.com mobile topup/recharge API. It provies a function (sendRequest) to execute any API call, but it also provides a few other helper functions.

## Summary
The main thing to know about this client is that it summits GET requests to the TransferTo enpoint (https://airtime.transferto.com/cgi-bin/shop/topup) and transforms the raw transferto text response, for each request, to a JSON object that your code can consume. The transformation also turns comma dilimited property values to arrays as demonstrated in the sample below.

```javascript
// Get a list of countries from the TransferTo
client.sendRequest({
    action: 'pricelist',
    info_type: 'countries'
}).then(console.log);
```

The above code would log something like this:
```javascript
{
    ...,
    country: [..., 'Peru', 'Philippines', 'Poland', 'Portugal', ...],
    countryid: [..., '839', '840', '841', '843', ...],
    ...
}
```

However, the raw transferto API response would have resembled:
```
...
contry=...,Peru,Philippines,Poland,Portugal,...
countryid=...,839,840,841,843,...
...
```

Thus, this client transforms text responses to JSON while converting comma delimited values to arrays.

## Usage

- [Installation](#installation)
- [Configure Client](#configure-client)
- [client.sendRequest](#clientsendrequest)
- [client.getCountries](#clientgetcountries)
- [client.getOperator](#clientgetoperator)
- [client.getMsisdnInfo](#clientgetmsisdninfo)
- [client.topup](#clienttopup)
- [TransfertoError](#transfertoerror)

### Installation
```shell
npm install --save transferto-client
```

### Configure Client
```javascript
// inports
const transferto = require('transferto-client');
const client = transferto('YOUR-LOGIN','YOUR-TOKEN');
```

### client.sendRequest
This is the basic function upon which all the other (helper) functions are built.

`@param` **options** - an object with properties that match the field names allowed by the TransferTo API. <br>
`@returns` - a promise with the parsed reponse data or a [TransfertoError](#transfertoerror) if the API responds with an error code (non 0).


```javascript
client.sendRequest({
    action: 'pricelist',
    info_type: 'countries'
}).then(data => {
    // do whatever
});
```

### client.getCountries
This gets a list of all TransferTo supported countries.

```javascript
client.getCountries()
    .then(data => {
        console.log(data);
    });

/* the output would resemble
{
    country: [..., 'Peru', 'Philippines', 'Poland', 'Portugal', ...],
    countryid: [..., '839', '840', '841', '843', ...],
    authentication_key: '1501643247561474',
    error_code: '0',
    error_txt: 'Transaction successful'
}
*/
```

### client.getCountry
This gets a country by its TransferTo id.

`@param` **countryId**

```javascript
client.getCountry(774)
    .then(data => {
        console.log(data);
    });

/* the output would resemble
{
    country: 'Jamaica',
    countryid: '774',
    operator:
    [ 'Digicel Jamaica Bundles USD', 'Digicel Jamaica USD', 'Flow Jamaica USD' ],
    operatorid: [ '2706', '1566', '1587' ],
    authentication_key: '1501643999412150',
    error_code: '0',
    error_txt: 'Transaction successful'
}
*/
```

### client.getOperator
This gets an operator by its TransferTo id.

`@param` **operatorId**

```javascript
client.getOperator(2706)
    .then(data => {
        console.log(data);
    });

/* the output would resemble
{
    country: 'Jamaica',
    countryid: '774',
    operator: 'Digicel Jamaica Bundles USD',
    operatorid: '2706',
    destination_currency: 'USD',
    requested_currency: 'USD',
    product_list: [ '15', '16', '24', '32' ],
    retail_price_list: [ '15.00', '16.00', '24.00', '32.00' ],
    wholesale_price_list: [ '13.80', '14.72', '22.08', '29.44' ],
    skuid_list: [ '16069', '16070', '16071', '16072' ],
    authentication_key: '1501726287688389',
    error_code: '0',
    error_txt: 'Transaction successful'
}
*/
```

### client.getMsisdnInfo
This gets information for and MSISDN.

`@param` **msisdn** <br />
`@param` **options** - (optional) properties allowed by the TransferTo API. This function has the following defaults that you can override with the **options** param:
```javascript
// default options that you can override with the options param
{
    delivered_amount_info: 1,
    return_service_fee: 1,
    currency: 'USD',
    return_promo: 1
}
```

```javascript
// sample usage 
client.getMsisdnInfo('18765555555', { return_promo: 0 })
    .then(data => {
        console.log(data);
    });

/* the output would resemble
{   ...,
    destination_msisdn: '18765555555',
    destination_currency: 'USD',
    requested_currency: 'USD',
    product_list: [ '5', '10', ... ],
    retail_price_list:[ '5.00', '10.00' ... ],
    ...
}
*/
```

### client.topup
This executes or similates a topup.

`@param` **options** an object with topup properties:
- **options.destination_msisdn** (required)
- **options.operatorid** (required)
- **options.skuid** (required) topup product skuid
- **options.product** (required) topup amount
- **options.simulate** (optional) set `true` to similate a transaction
- **options.msisdn** (optional) the *from* msisdn
- **options.sms** (optional) sms text
- **options.currency** (optional) defaults to 'USA'

```javascript
// sample usage 
client.topup({
    simulate: true, // true for simulation
    destination_msisdn: '18765555555',
    operatorid: 123,
    skuid: 321,
    product: 10.00    
}).then(data => {
    console.log(data);
});

/* the output would resemble
{   ...,
    transactionid: '572825718',
    destination_msisdn: '18765555555',
    destination_currency: 'USD',
    retail_price: '10.00',
    ...
}
*/
```


### TransfertoError
This extends JavaScript error object. It gets thrown in any of the API functions above when the error_code in the TransferTo response is anything but a 0; 0 being success for TransferTo.

The `message` property of a TransfertoError corresponds to the `error_txt` property in a TrasnferTo response. As for the `error_code`, TransfertoError provides the property `code`;

Example:
```javascript
...
// an example of a function call that will always fail
client.topup({ destination_msisdn: '18765555555' })
    .then(handleResponse)
    .catch(e => {
        // e.message -> same as error_txt
        // e.code -> same as error_code
    });
```

## License (MIT)
Copyright © 2017 Tafari Johnson, http://tafarijohnson.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.