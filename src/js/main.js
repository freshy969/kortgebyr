/**
*   @author Ulrik Moe, Christian Blach, Joakim Sindholt
*   @license GPLv3
**/

// WARNING: Remember to update the html (temporary solution)
let $currency = 'DKK';
let $avgvalue = new Currency(500, 'DKK');
let $qty = 200;
let $total = new Currency(500 * 200, 'DKK');
let $acquirer = ACQs;
let $cards = ['visa'];
let $features = [];
let $dankortscale = 0.77; // 77% of all trans to Dankort

function updateSettings() {
    const elems = this.elements;
    $currency = elems.currency.value;
    $avgvalue = new Currency(elems.avgvalue.value | 0, $currency);
    $qty = elems.qty.value | 0;
    $total = $avgvalue.scale($qty);
    $cards = [];
    $features = [];
    $acquirer = elems.acquirer.value;

    const cards = elems['cards[]'];
    for (let i = 0; i < cards.length; i++) {
        if (cards[i].checked) { $cards.push(cards[i].value); }
    }
    const features = elems['features[]'];
    for (let i = 0; i < features.length; i++) {
        if (features[i].checked) { $features.push(features[i].value); }
    }
    build();
}





function sum() {
    let sumobj = new Currency(0, 'DKK');
    for (let i = 0; i < arguments.length; i++) {
        // Combine costs
        for (let j = 0; j < arguments[i].length; j++) {
            sumobj = sumobj.add(arguments[i][j].fee);
        }
    }
    return sumobj;
}

// Check if object-x' properties is in object-y.
function objContainsArr(obj, arr) {
    for (let i = 0; i < arr.length; i++) {
        if (!obj[arr[i]]) { return false; }
    }
    return true;
}


// Find combination of acquirers that support all cards
function acqcombo(psp, acqlist) {
    let skip;
    let single = null;

    // Loop through psp.acqs and test if a single acquirer
    // support all required cards and features.

    for (let i = 0; i < psp.acqs.length; i++) {
        console.log(psp.acqs[i]);
    }

    // Construct an array of acqs that the psp support and
    // test if a single acquirer support all required cards.
    for (let i = 0; i < ACQs.length; i++) {
        if (psp.acqs[ACQs[i].name]) {
            acqlist.push(ACQs[i]);

            if (!single && objContainsArr(ACQs[i].cards, $cards)) {
                single = ACQs[i];
                if (single.name !== 'nets') { skip = true; }
            }
        }
    }



    // const cardscale = (acqs[i].name === 'Nets') ? $dankortscale : 1 - $dankortscale;
    if (!skip && psp.acqs.nets) {
        const missingCards = [];

        for (let i = 0; i < $cards.length; i++) {
            const card = $cards[i];
            if (card !== 'dankort' && card !== 'forbrugsforeningen') {
                missingCards.push(card);
            }
        }

        // Find secondary acq to accomodate the first
        for (let k = i + 1; k < acqlist.length; k++) {
            if (objContainsArr(acqlist[k].cards, missingCards)) {
                // TODO: tmp solution while acqs are in same currency.
                if (single.TC.value < (acq.TC.value + acqlist[k].TC.value)) {
                    console.log(single.name + ': ' + single.TC.value);
                    console.log(acq.name + '/' + acqlist[k].name + ': ' + (acq.TC.value + acqlist[k].TC.value));
                    return [single];
                }
                return [acq, acqlist[k]];
            }
        }

    }

    for (let i = 0; i < acqlist.length; i++) {
        const acq = acqlist[i];
        const missingCards = [];

        for (let j = 0; j < $cards.length; j++) {
            if (!acq.cards[$cards[j]]) {
                missingCards.push($cards[j]);
            }
        }

        // Return if acq support all
        if (missingCards.length === 0) { return [acq]; }

        // Find secondary acq to accomodate the first
        for (let k = i + 1; k < acqlist.length; k++) {
            if (objContainsArr(acqlist[k].cards, missingCards)) {
                // TODO: tmp solution while acqs are in same currency.
                if (single.TC.value < (acq.TC.value + acqlist[k].TC.value)) {
                    console.log(single.name + ': ' + single.TC.value);
                    console.log(acq.name + '/' + acqlist[k].name + ': ' + (acq.TC.value + acqlist[k].TC.value));
                    return [single];
                }
                return [acq, acqlist[k]];
            }
        }
    }

    return single;
}


function oHasArr(obj, arr) {
    for (let i = 0; i < arr.length; i++) {
        const key = arr[i];
        if (!obj[key]) { return false; }
        if (obj[key].setup) { addCosts(obj[key]); }
    }
    return true;
}

function addCosts(obj) {
    setup.push(obj.setup);
    monthly.push(obj.monthly);
    trn.push(obj.trn);
}


function containsAll(arrs) {
    const obj = {};
    const len = arrs.length;

    // for each array passed as an argument to the function
    for (let i = 0; i < len; i++) {
        const array = arrs[i];

        // for each element in the array
        for (let j = 0; j < array.length; j++) {
            obj[array[j]] = obj[array[j]] + 1 || 1;
        }
    }

    // now collect all results that are in all arrays
    const output = [];
    for (let item in obj) {
        if (obj[item] === len) {
            output.push(PSPs[item]);
        }
    }
    return output;
}


function build() {
    const data = [];
    const tbody = document.createElement('tbody');
    tbody.id = 'tbody';

    // If the user select a specific acquirer then we will
    // only show PSPs that support this acquirer.
    const psplist = [];
    let acqlist = [];
    if ($acquirer !== 'all') {
        psplist[0] = ACQs[$acquirer].psps;
        acqlist = [$acquirer];
    }

    for (let i = 0; i < $cards.length; i++) {
        psplist.push(cards[$cards[i]]);
        // acqlist.push(cards[$cards[i]]);
    }

    for (let i = 0; i < $features.length; i++) {
        psplist.push(features[$features[i]]);
        // acqlist.push(features[$features[i]]);
    }
    const psps = containsAll(psplist);


    // Build PSPs
    for (let i = 0; i < psps.length; i++) {
        const psp = psps[i];
        const costs = {
            setup: [],
            monthly: [],
            trn: []
        };
        if (psp.calc(costs) === false) { continue; }
        if (psp.monthly) { costs.monthly.push({ name: psp.name, fee: psp.monthly }); }
        if (psp.setup) { costs.setup.push({ name: psp.name, fee: psp.setup }); }

        const acqfrag = document.createDocumentFragment();
        const acqcards = {};
        if (psp.acqs) {
            const acqArr = acqcombo(psp, acqlist); // Find acq with full card support

            for (let k = 0; k < acqArr.length; k++) {
                const acq = acqArr[k];
                if (acq.monthly) { costs.monthly.push({ name: acq.name, fee: acq.monthly }); }
                if (acq.setup) { costs.setup.push({ name: acq.name, fee: acq.setup }); }
                //trn[acq.name] = acq.trnfees;

                const acqlink = document.createElement('a');
                acqlink.href = acq.link;
                acqlink.className = 'acq';
                const acqlogo = new Image();
                acqlogo.src = '/img/psp/' + acq.logo + '?{{ imgtoken }}';
                acqlogo.alt = acq.name;
                acqlink.appendChild(acqlogo);
                acqfrag.appendChild(acqlink);
                acqfrag.appendChild(document.createElement('br'));

                // Construct a new acqcards
                for (let card in acq.cards) {
                    acqcards[card] = acq.cards[card];
                }
            }
        }

        const cardfrag = document.createDocumentFragment();
        for (let card in psp.cards) {
            //  Some cards/methods (e.g. mobilepay) add extra costs.
            if (psp.cards[card].setup) {
                if (!$cards[card]) { continue; } // Disable if not enabled.
                setup[card] = psp.cards[card].setup;
                monthly[card] = psp.cards[card].monthly;
                trn[card] = psp.cards[card].trn;
            }

            const cardicon = new Image(22, 15);
            cardicon.src = '/img/cards/' + card + '.svg?{{ imgtoken }}';
            cardicon.alt = card;
            cardicon.className = 'card';
            cardfrag.appendChild(cardicon);
        }

        // Calculate TC and sort psps
        const totalcost = sum(costs.monthly, costs.trn);
        let sort;
        for (sort = 0; sort < data.length; ++sort) {
            if (totalcost.dkk() < data[sort]) { break; }
        }
        data.splice(sort, 0, totalcost.dkk());

        // Create PSP logo.
        const pspfrag = document.createDocumentFragment();
        const psplink = document.createElement('a');
        psplink.target = '_blank';
        psplink.href = psp.link;
        psplink.className = 'psp';
        const psplogo = new Image(psp.w, psp.h);
        psplogo.src = '/img/psp/' + psp.logo + '?{{ imgtoken }}';
        psplogo.alt = psp.name;
        const pspname = document.createElement('span');
        pspname.textContent = psp.name;
        psplink.appendChild(psplogo);
        psplink.appendChild(pspname);
        pspfrag.appendChild(psplink);

        // setup fees
        const setupfrag = document.createDocumentFragment();
        setupfrag.textContent = sum(costs.setup).print();
        const setup_info = document.createElement('div');
        setup_info.textContent = '[?]';
        setup_info.className = 'info';
        //setup_info.ttdata = setup;
        setup_info.addEventListener('mouseover', showTooltip);
        setupfrag.appendChild(setup_info);

        // Recurring fees
        const recurringfrag = document.createDocumentFragment();
        recurringfrag.textContent = sum(costs.monthly).print();
        const recurring_info = document.createElement('div');
        recurring_info.textContent = '[?]';
        recurring_info.className = 'info';
        //recurring_info.ttdata = monthly;
        recurring_info.addEventListener('mouseover', showTooltip);
        recurringfrag.appendChild(recurring_info);

        // Trn fees
        const trnfrag = document.createDocumentFragment();
        trnfrag.textContent = sum(costs.trn).print();
        const trn_info = document.createElement('div');
        trn_info.textContent = '[?]';
        trn_info.className = 'info';
        //trn_info.ttdata = trn;
        trn_info.addEventListener('mouseover', showTooltip);
        trnfrag.appendChild(trn_info);

        // cardfee calc.
        const cardfeefrag = document.createDocumentFragment();
        const p1 = document.createElement('p');
        const cardfee = totalcost.scale(1 / ($qty || 1));
        cardfeefrag.textContent = cardfee.print();
        p1.textContent = '(' + (cardfee.scale(1 / $avgvalue.dkk()).dkk() * 100).toFixed(3).replace('.', ',') + '%)';
        p1.className = 'procent';
        cardfeefrag.appendChild(p1);

        const row = tbody.insertRow(sort);
        row.insertCell(-1).appendChild(pspfrag);
        row.insertCell(-1).appendChild(acqfrag);
        const card_cell = row.insertCell(-1);
        card_cell.className = 'cardsth';
        card_cell.appendChild(cardfrag);
        row.insertCell(-1).appendChild(setupfrag);
        row.insertCell(-1).appendChild(recurringfrag);
        row.insertCell(-1).appendChild(trnfrag);
        row.insertCell(-1).textContent = totalcost.print();
        row.insertCell(-1).appendChild(cardfeefrag);
    }

    $('table').replaceChild(tbody, $('tbody'));
}



// TODO: Move this to gulp!
const cards = {
    dankort: [],
    visa: [],
    mastercard: [],
    maestro: [],
    amex: [],
    jcb: [],
    unionpay: [],
    diners: [],
    mobilepay: [],
    forbrugsforeningen: []
};

for (let i = 0; i < PSPs.length; i++) {
    const psp = PSPs[i];

    for (let j = 0; j < psp.cards.length; j++) {
        cards[psp.cards[j]].push(i);
    }

    if (psp.acqs) {
        for (let j = 0; j < psp.acqs.length; j++) {
            // Push the PSP to the acq.psp[]
            if (!ACQs[psp.acqs[j]].psps) {
                ACQs[psp.acqs[j]].psps = [];
            }
            ACQs[psp.acqs[j]].psps.push(i);
        }
    }
}
// TODO: END


//build();
$('form').addEventListener('change', updateSettings);
$('form').addEventListener('keyup', updateSettings);
$('currency').onchange = function () {
    $('currency_code').textContent = this.value;
};
