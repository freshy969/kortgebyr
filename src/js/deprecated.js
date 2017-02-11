/**
*   @author Ulrik Moe, Christian Blach, Joakim Sindholt
*   @license GPLv3
**/

/*
for (let key in opts) {
    let value = opts[key];
    if (key === 'avgvalue') { value = value.value; }

    if (value.constructor === Array) {
        const list = form.elements[key + '[]'] || [];
        for (let i = 0; i < list.length; i++) {
            list[i].checked = value.indexOf(list[i].value) >= 0;
        }
    } else if (form.elements[key]) {
        form.elements[key].value = value;
    }
}
*/


/*
// Calculate acquirer costs and sort by Total Costs.
for (let i = 0; i < acqs.length; i++) {
    acqs[i].trnfees = acqs[i].trn(opts).scale(opts.transactions).scale(cardscale);
    acqs[i].TC = acqs[i].trnfees.add(acqs[i].monthly);
}
acqs.sort(function (obj1, obj2) { return obj1.TC.dkk() - obj2.TC.dkk(); });
*/

// TODO: Get rid of this
function getInt(elem, action) {
    const str = elem.value.trim();
    if (!isNaN(parseFloat(str)) && isFinite(str) &&
    parseFloat(str) === parseInt(str, 10)) {
        elem.classList.remove('error');
        return parseInt(str, 10);
    }
    elem.classList.add('error');
    return null;
}

// TODO: Remove this
function setInt(k, v) {
    $(k).value = parseInt(v, 10);
    $(k).classList.remove('error');
}


function mkcurregex() {
    const arr = [];
    for (let k in currency_map) {
        arr.push(currency_map[k]);
    }
    for (let k in currency_value) {
        arr.push(k);
    }
    return RegExp('^ *([0-9][0-9., ]*)(' + arr.join('|') + ')? *$', 'i');
}
const curregex = mkcurregex();

function _getCurrency(currency) {
    const a = currency.match(curregex);
    if (a === null) { return null; }

    let c = a[2] ? a[2] : currency_map[opts.currency];
    if (c.toLowerCase() === currency_map[opts.currency].toLowerCase()) {
        /* there are a lot of currencies named kr and we should prefer the kr
        * that has been selected */
        c = opts.currency;
    } else {
        /* if that's not what's selected, find the currency */
        for (let k in currency_map) {
            if (currency_map[k].toLowerCase() === c.toLowerCase() ||
            k.toLowerCase() === c.toLowerCase()) {
                c = k;
                break;
            }
        }
    }
    return new Currency(parseFloat(a[1].replace('.', '').replace(',', '.')), c);
}

function getCurrency(currency, action) {

    if (action === 'init') { $(currency).addEventListener('input', build); }

    const a = _getCurrency($(currency).value);
    if (a === null) {
        $(currency).classList.add('error');
        return null;
    }
    $(currency).classList.remove('error');
    return a;
}


const opts = {
    cards: {
        type: 'bits',
        bits() { return document.getElementsByClassName('ocards').length; },
        get(action) {
            // Get all selected payment methods from .ocards
            const obj = {};
            const ocards = document.getElementsByClassName('ocards');
            let bitval = 0;
            for (let i = 0; i < ocards.length; i++) {
                const checkbox = ocards[i];
                if (checkbox.checked) {
                    obj[checkbox.id] = 1;
                    if (checkbox.id === 'visa') { obj.mastercard = 1; }
                    bitval += 1 << i;
                }
            }
            return obj;
        },
        set(bitval) {
            const ocards = document.getElementsByClassName('ocards');
            for (let i = 0; i < ocards.length; i++) {
                const checkbox = ocards[i];
                checkbox.checked = (bitval & (1 << i)) !== 0;
            }
        }
    },
    features: {
        type: 'bits',
        bits() { return document.getElementsByClassName('ofeatures').length; },
        get(action) {
            // Get all selected features
            const obj = {};
            const ofeatures = document.getElementsByClassName('ofeatures');
            let bitval = 0;
            for (let i = 0; i < ofeatures.length; i++) {
                const checkbox = ofeatures[i];
                if (checkbox.checked) {
                    obj[checkbox.id] = 1;
                    bitval += 1 << i;
                }
            }
            //if (action === 'url') { return bitval; }
            return obj;
        },
        set(bitval) {
            const ofeatures = document.getElementsByClassName('ofeatures');
            for (let i = 0; i < ofeatures.length; i++) {
                const checkbox = ofeatures[i];
                checkbox.checked = (bitval & (1 << i)) !== 0;
            }
        }
    },
    // Misc
    acquirers: {
        type: 'bits',
        bits() {
            let len = $('acquirer').length;
            let nbits = 0;
            while (len) {
                len = len >>> 1;
                nbits++;
            }
            return nbits;
        },
        get(action) {
            // Return the selected acquirers
            const index = $('acquirer').selectedIndex;
            if (index) {
                return [ACQs[0], ACQs[index]];
            }
            return ACQs.slice(0);
        },
        set(bitval) {
            if (bitval < $('acquirer').length) { $('acquirer').selectedIndex = bitval; }
        },
    },
    transactions: {
        type: 'string',
        dirty_bits: 1,
        get_dirty_bits() { return +(this.get() !== parseInt($('transactions').defaultValue)); },
        get(action) {
            return getInt($('transactions'), action);
        },
        set(v) { setInt('transactions', v); }
    },
    avgvalue: {
        type: 'currency',
        dirty_bits: 1,
        get_dirty_bits() { return +(!this.get().is_equal_to(_getCurrency($('avgvalue').defaultValue))); },
        get(action) { return getCurrency('avgvalue', action); },
        set(v) {
            // setCurrency('avgvalue', _getCurrency(v))
        }
    },
    currency: {
        type: 'string',
        dirty_bits: 1,
        get_dirty_bits() { return +(this.get() !== $('currency_code_select').options[0].value); },
        get() { return gccode; },
        set(v) {
            const select = $('currency_code_select');
            for (let i = 0; i < select.length; i++) {
                if (select.options[i].value === v) {
                    select.selectedIndex = i;
                    $('currency_code').innerHTML = v;
                    break;
                }
            }
            //set_ccode(v);
        }
    }
};
