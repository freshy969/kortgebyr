/**
*   @author Ulrik Moe, Christian Blach, Joakim Sindholt
*   @license GPLv3
**/

const currency_value = {
    DKK: 1,
    SEK: 0.781,
    NOK: 0.827,
    EUR: 7.434,
    USD: 7.123,
    GBP: 8.752
};

const currency_map = {
    DKK: 'kr',
    SEK: 'kr',
    NOK: 'kr',
    EUR: '€',
    USD: '$',
    GBP: '£'
};

function Currency(value, code) {
    this.code = code;
    this.value = value;
}

Currency.prototype.print = function () {
    let value = this.value;
    if (this.code !== opts.currency) {
        value = this.dkk() / currency_value[opts.currency]; // Convert currency.
    }
    value = Math.round(value * 100) / 100; // 2 decimals after point
    value = value.toString().replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return value + ' ' + currency_map[opts.currency];
};


Currency.prototype.dkk = function () {
    if (this.code === 'DKK') {
        return this.value;
    }
    return this.value * currency_value[this.code];
};


Currency.prototype.add = function (o) {
    if (this.code === o.code) {
        return new Currency(this.value + o.value, this.code);
    }
    const converted = o.dkk() / currency_value[this.code]; // Convert currency
    return new Currency(this.value + converted, this.code);
};


Currency.prototype.scale = function (n) {
    return new Currency(this.value * n, this.code);
};


