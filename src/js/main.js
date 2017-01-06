/**
*   @author Ulrik Moe, Christian Blach, Joakim Sindholt
*   @license GPLv3
**/

const settings = {
    currency: 'DKK',
    transactions: 250,
    avgvalue: 450,
    acquirers: ACQs,
    cards: ['dankort', 'visa', 'mastercard'],
    features: ['3-D secure'],
    // TODO: Improve how we distribute trns between acqs/cards.
    dankortscale: 0.77 // 77% of all trans to Dankort
};


function $(s) {
    return document.getElementById(s);
}

function showTooltip() {
    if (!this.firstElementChild) {
        const infobox = document.createElement('ul');
        const obj = this.ttdata;
        for (let prop in obj) {
            let costobj = obj[prop];
            if (typeof costobj === 'function') {
                costobj = costobj(settings);
            }

            const li = document.createElement('li');
            li.textContent = prop + ': ' + costobj.print();
            infobox.appendChild(li);
        }
        this.appendChild(infobox);
    }
}

// TODO: Get rid of this
function changeCurrency() {
    $('currency_code').textContent = this.value;
}

// Check if object-x' properties is in object-y.
function x_has_y(objx, objy) {
    for (let prop in objy) {
        if (!objx[prop]) { return false; }
    }
    return true;
}

// Find combination of acquirers that support all cards
function acqcombo(psp, settings) {
    const A = settings.acquirers;
    const acqarr = [];

    // Check if a single acq support all cards.
    for (let acq of A) {
        if (psp.acquirers[acq.name]) {
            // Return acq if it support all settings.cards.
            if (x_has_y(acq.cards, settings.cards)) { return [acq]; }
            acqarr.push(acq);
        }
    }

    // Nope. Then we'll need to search for a combination of acquirers.
    const len = acqarr.length;
    for (let i = 0; i < len; i++) {
        const primary = acqarr[i];
        let missingCards = {};

        for (let card in settings.cards) {
            if (!primary.cards[card]) { missingCards[card] = true; }
        }

        // Find secondary acquirer with the missing cards.
        for (let j = i + 1; j < len; j++) {
            let secondary = acqarr[j];
            if (x_has_y(secondary.cards, missingCards)) {
                return [primary, secondary];
            }
        }
    }
    return null;
}


function updateSettings() {
    for (let name in settings) {
        const elem = this.elements[name];
        if (!elem) { continue; }
        if (settings[name].constructor === Array) {
            settings[name].length = 0; // Reset array
            for (let i = 0; i < elem.length; i++) {
                const checkbox = elem[i];
                if (checkbox.checked) {
                    settings[name].push(checkbox.value);
                }
            }
        } else {
            settings[name] = (elem.type === 'number') ? elem.value | 0 : elem.value;
        }
    }
    build();
}


function build() {
    const data = [];
    const tbody = document.createElement('tbody');
    tbody.id = 'tbody';

    // At least one card selected
    if (settings.cards.length === 0) { return false; }

    // Calculate acquirer costs and sort by Total Costs.
    for (let acq of settings.acquirers) {
        console.log(acq);
        const cardscale = (acq.name === 'Nets') ? settings.dankortscale : 1 - settings.dankortscale;

        acq.trnfees = acq.fees.trn(settings).scale(settings.transactions).scale(cardscale);
        acq.TC = acq.trnfees.add(acq.fees.monthly);
    }
    settings.acquirers.sort(function (obj1, obj2) { return obj1.TC.dkk() - obj2.TC.dkk(); });



    psploop:
    for (let psp of PSPs) {
        const setup = {};
        const monthly = {};
        const trnfee = {};

        setup[psp.name] = psp.fees.setup;
        monthly[psp.name] = psp.fees.monthly;
        trnfee[psp.name] = psp.fees.trn(settings);

        // Check if psp support all enabled payment methods
        for (let card in settings.cards) { if (!psp.cards[card]) { continue psploop; } }

        // Check if psp support all enabled features
        for (let i in settings.features) {
            if (!psp.features || !psp.features[i]) { continue psploop; }
            const feature = psp.features[i];
            if (feature.setup) {
                setup[i] = feature.setup;
                monthly[i] = feature.monthly;
                trnfee[i] = feature.trn;
            }
        }

        // If an acquirer has been selected then hide the Stripes
        if (settings.acquirers.length < 3 && !psp.acquirers) { continue; }

        const acqfrag = document.createDocumentFragment();
        const acqcards = {};
        let acqArr = [];
        if (psp.acquirers) {

            acqArr = acqcombo(psp, settings); // Find acq with full card support
            if (!acqArr) { continue; }
            for (let acq of acqArr) {
                setup[acq.name] = acq.fees.setup;
                monthly[acq.name] = acq.fees.monthly;
                trnfee[acq.name] = acq.trnfees;

                const acqlink = document.createElement('a');
                acqlink.href = acq.link;
                acqlink.className = 'acq';
                const acqlogo = new Image(acq.w, acq.h);
                acqlogo.src = '/img/psp/' + acq.logo;
                acqlogo.alt = acq.name;
                acqlink.appendChild(acqlogo);
                acqfrag.appendChild(acqlink);
                acqfrag.appendChild(document.createElement('br'));

                // Construct a new acqcards
                for (let card in acq.cards) { acqcards[card] = acq.cards[card]; }
            }
        }

        const cardfrag = document.createDocumentFragment();
        for (let card in psp.cards) {

            if (psp.acquirers && !acqcards[card]) { continue; }

            //  Some cards/methods (e.g. mobilepay) add extra costs.
            if (psp.cards[card].setup) {
                if (!settings.cards[card]) { continue; } // Disable if not enabled.
                setup[card] = psp.cards[card].setup;
                monthly[card] = psp.cards[card].monthly;
                trnfee[card] = psp.cards[card].trn;
            }

            const cardicon = new Image(22, 15);
            cardicon.src = '/img/cards/' + card + '.svg';
            cardicon.alt = card;
            cardicon.className = 'card';
            cardfrag.appendChild(cardicon);
        }

        // Calculate TC and sort psps
        const totalcost = sum(monthly, trnfee);
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
        psplogo.src = '/img/psp/' + psp.logo;
        psplogo.alt = psp.name;
        const pspname = document.createElement('p');
        pspname.textContent = psp.name;
        psplink.appendChild(psplogo);
        psplink.appendChild(pspname);
        pspfrag.appendChild(psplink);

        // setup fees
        const setupfrag = document.createDocumentFragment();
        setupfrag.textContent = sum(setup).print();
        const setup_info = document.createElement('div');
        setup_info.textContent = '[?]';
        setup_info.className = 'info';
        setup_info.ttdata = setup;
        setup_info.addEventListener('mouseover', showTooltip);
        setupfrag.appendChild(setup_info);

        // Recurring fees
        const recurringfrag = document.createDocumentFragment();
        recurringfrag.textContent = sum(monthly).print();
        const recurring_info = document.createElement('div');
        recurring_info.textContent = '[?]';
        recurring_info.className = 'info';
        recurring_info.ttdata = monthly;
        recurring_info.addEventListener('mouseover', showTooltip);
        recurringfrag.appendChild(recurring_info);

        // Trn fees
        const trnfrag = document.createDocumentFragment();
        trnfrag.textContent = sum(trnfee).print();
        const trn_info = document.createElement('div');
        trn_info.textContent = '[?]';
        trn_info.className = 'info';
        trn_info.ttdata = trnfee;
        trn_info.addEventListener('mouseover', showTooltip);
        trnfrag.appendChild(trn_info);

        // cardfee calc.
        const cardfeefrag = document.createDocumentFragment();
        const p1 = document.createElement('p');
        const cardfee = totalcost.scale(1 / (settings.transactions || 1));
        cardfeefrag.textContent = cardfee.print();
        p1.textContent = '(' + (cardfee.scale(1 / settings.avgvalue.dkk()).dkk() * 100).toFixed(3).replace('.', ',') + '%)';
        p1.className = 'procent';
        cardfeefrag.appendChild(p1);

        const row = tbody.insertRow(sort);
        row.insertCell(-1).appendChild(pspfrag);
        row.insertCell(-1).appendChild(acqfrag);
        row.insertCell(-1).appendChild(cardfrag);
        row.insertCell(-1).appendChild(setupfrag);
        row.insertCell(-1).appendChild(recurringfrag);
        row.insertCell(-1).appendChild(trnfrag);
        row.insertCell(-1).textContent = totalcost.print();
        row.insertCell(-1).appendChild(cardfeefrag);
    }
    $('table').replaceChild(tbody, $('tbody'));
}



window.onload = function () {
    //build();
    // settings2form();

    updateForm(settings);

    const form = $('form');
    for (let name in obj) {
        console.log(name);

        //form.elements[name];


    }

    form.addEventListener('change', updateSettings);
    form.addEventListener('keyup', updateSettings);
    $('currency').addEventListener('change', changeCurrency);
};
