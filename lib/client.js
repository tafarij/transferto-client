const request = require('request-promise-native');
const crypto = require('crypto');

const TransfertoError = require('./transferto-error');

/**
 * Creates a Transerclient client object
 * @param {string} login - trasnfer-to login id
 * @param {string} token - transfer-to secret token
 */
module.exports = function client(login, token) {
  const endpoint = 'https://airtime-api.dtone.com/cgi-bin/shop/topup';

  const generateNonce = () => {
    const rnd = Math.floor(Math.random() * 1000) + 1;
    const now = new Date().getTime();
    return `${now}${rnd}`;
  };

  const txtToJson = txt => {
    const excludes = ['promotion', 'sms', 'info_txt'];

    return txt
      .trim()
      .split(/\r?\n/)
      .reduce((out, line) => {
        const parts = line
          .trim()
          .replace(/,$/, '')
          .split(/=(.*)/);

        if (!excludes.includes(parts[0]) && parts[1].includes(',')) {
          out[parts[0]] = parts[1].split(',');
        } else {
          out[parts[0]] = parts[1];
        }

        return out;
      }, {});
  };

  const sendRequest = data => {
    const key = generateNonce();
    const md5 = crypto
      .createHash('md5')
      .update(login + token + key)
      .digest('hex');

    const opts = {
      uri: endpoint,
      qs: Object.assign({}, data, { login, key, md5 })
    };

    return request(opts)
      .then(txtToJson)
      .then(result => {
        if (result.error_code === '0') {
          return result;
        } else {
          throw new TransfertoError(result.error_txt, result.error_code);
        }
      });
  };

  return {
    /**
     * Sends a get transferto request
     * @param {Object} data - transferto API request properties
     * @returns {Promise<Object>}
     */
    sendRequest,

    /**
     * Gets all the countries
     * @returns {Promise<Object>}
     */
    getCountries() {
      return sendRequest({
        action: 'pricelist',
        info_type: 'countries'
      });
    },

    /**
     * Gets a country by id
     * @param {string} countryId
     * @returns {Promise<Object>}
     */
    getCountry(countryId) {
      return sendRequest({
        action: 'pricelist',
        info_type: 'country',
        content: countryId
      });
    },

    /**
     * Gets an operator by id
     * @param {string} operatorId
     * @returns {Promise<Object>}
     */
    getOperator(operatorId) {
      return sendRequest({
        action: 'pricelist',
        info_type: 'operator',
        content: operatorId
      });
    },

    /**
     * Does a msisdn_info lookup with defaults:
     * {delivered_amount_info: 1, return_service_fee: 1, currency: 'USD', return_promo: 1}
     * @param {string} msisdn
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    getMsisdnInfo(msisdn, options = {}) {
      const payload = Object.assign(
        {
          delivered_amount_info: 1,
          return_service_fee: 1,
          currency: 'USD',
          return_promo: 1
        },
        options,
        {
          action: 'msisdn_info',
          destination_msisdn: msisdn
        }
      );

      return sendRequest(payload);
    },

    /**
     * Execute or simulate a top up transaction
     * @param {Object} options
     * @param {boolean} options.simulate - (optional) defaults to false for simulation
     * @param {string} options.destination_msisdn - (required) destination number
     * @param {string} options.msisdn - (optional) from number
     * @param {string} options.operatorid - (required) operator id
     * @param {string} options.skuid - (required) product sku is
     * @param {string} options.product - (required) product price
     * @param {string} options.sms - (optional) sms to receiver
     * @param {string} options.currency - (optional) defaults to 'USD'
     * @returns {Promise<Object>}
     */
    topup({
      simulate,
      destination_msisdn,
      msisdn,
      operatorid,
      skuid,
      product,
      sms,
      currency = 'USD'
    }) {
      return sendRequest({
        action: simulate ? 'simulation' : 'topup',
        return_service_fee: 1,
        return_promo: 1,
        delivered_amount_info: 1,
        destination_msisdn,
        msisdn,
        operatorid,
        skuid,
        product,
        sms,
        currency
      });
    }
  };
};
