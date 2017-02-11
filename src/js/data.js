/**
*   @author Ulrik Moe, Christian Blach, Joakim Sindholt
*   @license GPLv3
**/

const mobilepay = {
    setup: new Currency(49, 'DKK'),
    monthly: new Currency(49, 'DKK'),
    trn() {
        return (new Currency(1, 'DKK')).scale(opts.qty / 20);
    }
};

// Acquirers!
const ACQs = {
    nets: {
        name: 'nets',
        logo: 'nets.svg',
        link: 'https://dankort.dk/Pages/Forretninger.aspx',
        cards: ['dankort', 'forbrugsforeningen', 'mobilepay'],
        psps: [],
        setup: new Currency(250, 'DKK'),
        monthly: new Currency(83.33, 'DKK'), // 1000 / 12
        trn(value, qty) {
            const avgvalue = opts.avgvalue.dkk();
            const fee = (avgvalue <= 50) ? 0.7 : (avgvalue <= 100) ? 1.1 : 1.39;
            return new Currency(fee * qty, 'DKK');
        }
    },
    teller: {
        name: 'teller',
        logo: 'teller.svg',
        link: 'https://www.nets.eu/dk/payments/online-betalinger/',
        cards: ['visa', 'mastercard', 'maestro', 'amex', 'jcb', 'unionpay', 'diners', 'mobilepay'],
        psps: [],
        setup: new Currency(1000, 'DKK'),
        monthly: new Currency(149, 'DKK'),
        trn(value, qty) {
            // 1.34 % + 0.19 DKK (min 0.7 DKK)
            const trnfee = opts.avgvalue.scale(1.34 / 100).add(new Currency(0.19, 'DKK'));
            if (trnfee.dkk() < 0.7) {
                return new Currency(0.7, 'DKK');
            }
            return trnfee;
        }
    },
    handelsbanken: {
        name: 'handelsbanken',
        logo: 'handelsbanken.svg',
        link: 'http://www.handelsbanken.dk',
        cards: ['visa', 'mastercard', 'maestro'],
        psps: [],
        trn(value, qty) {
            return opts.avgvalue.scale(1.5 / 100);
        }
    },
    swedbank: {
        name: 'swedbank',
        logo: 'swedbank.png',
        link: 'http://www.swedbank.dk',
        cards: ['visa', 'mastercard', 'maestro'],
        psps: [],
        setup: new Currency(1900, 'DKK'),
        monthly: new Currency(100, 'DKK'),
        trn(value, qty) {
            return opts.avgvalue.scale(1.6 / 100);
        }
    },
    valitor: {
        name: 'valitor',
        logo: 'valitor.png',
        link: 'http://www.valitor.com',
        cards: ['visa', 'mastercard', 'maestro'],
        psps: [],
        trn(value, qty) {
            return opts.avgvalue.scale(1.5 / 100);
        }
    },
    elavon: {
        name: 'elavon',
        logo: 'elavon.svg',
        link: 'http://www.elavon.com',
        cards: ['visa', 'mastercard', 'maestro'],
        psps: [],
        trn(value, qty) {
            return opts.avgvalue.scale(1.6 / 100);
        }
    },
    clearhaus: {
        name: 'clearhaus',
        logo: 'clearhaus.svg',
        link: 'https://www.clearhaus.com',
        cards: ['visa', 'mastercard', 'maestro', 'mobilepay'],
        psps: [],
        trn(value, qty) {
            // 1.45% (min. 0.6 DKK)
            const trnfee = opts.avgvalue.scale(1.45 / 100);
            if (trnfee.dkk() < 0.6) {
                return new Currency(0.6, 'DKK');
            }
            return trnfee;
        }
    },
    bambora: {
        name: 'bambora',
        logo: 'bambora.svg',
        link: 'http://www.bambora.com',
        cards: ['visa', 'mastercard', 'maestro', 'diners'],
        psps: [],
        trn(value, qty) {
            return opts.avgvalue.scale(1.45 / 100);
        }
    }
};



const PSPs = [
    {
        name: 'Braintree',
        logo: 'braintree.svg',
        link: 'https://www.braintreepayments.com',
        features: ['antifraud', 'recurring'],
        cards: ['visa', 'mastercard', 'maestro'],
        calc(o) {
            o.trn.push({
                name: 'Braintree',
                info: '1,9% + 2,25 DKK pr. transaktion',
                fee: opts.total.scale(1.9 / 100).add(new Currency(2.25 * opts.qty, 'DKK'))
            });
        }
    },
    {
        name: 'Certitrade',
        logo: 'certitrade.svg',
        link: 'https://certitrade.se',
        features: ['antifraud', 'recurring'],
        cards: ['visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners'],
        acqs: ['bambora', 'clearhaus', 'swedbank', 'handelsbanken', 'elavon'],
        monthly: new Currency(206, 'SEK'),
        calc(o) {
            o.trn.push({
                name: 'Certitrade',
                info: '0,9% + 1,5 SEK pr. transaktion',
                fee: opts.total.scale(0.9 / 100).add(new Currency(1.5 * opts.qty, 'SEK'))
            });
        }
    },
    {
        name: 'Checkout.com',
        logo: 'checkoutcom.svg',
        link: 'https://www.checkout.com',
        features: ['antifraud', 'recurring'],
        cards: ['visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners', 'unionpay'],
        calc(o) {
            o.trn.push({
                name: 'Checkout.com',
                info: '1,5% + 0,15 EUR pr. transaktion',
                fee: opts.total.scale(1.5 / 100).add(new Currency(0.15 * opts.qty, 'EUR'))
            });
        }
    },
    {
        name: 'DanDomain',
        logo: 'dandomain.svg',
        link: 'https://www.dandomain.dk/webshop/betalingssystem',
        features: [],
        cards: ['dankort', 'visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners', 'unionpay', 'mobilepay', 'forbrugsforeningen'],
        acqs: ['nets', 'teller'],
        setup: new Currency(199, 'DKK'),
        monthly: new Currency(149, 'DKK'),
        calc() {}
    },
    {
        name: 'Scannet',
        logo: 'scannet.svg',
        link: 'https://www.scannet.dk/betalingsloesning/',
        features: [],
        cards: ['dankort', 'visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners', 'unionpay', 'mobilepay', 'forbrugsforeningen'],
        acqs: ['nets', 'teller'],
        monthly: new Currency(399, 'DKK'),
        calc() {}
    },
    {
        name: 'DIBS Start',
        logo: 'dibs.svg',
        link: 'http://dibs.dk',
        features: ['antifraud', 'recurring'],
        cards: ['dankort', 'mobilepay'],
        acqs: ['nets'],
        setup: new Currency(1495, 'DKK'),
        monthly: new Currency(149, 'DKK'),
        calc(o) {
            o.trn.push({
                name: 'DIBS',
                info: '0,6 DKK pr. transaktion',
                fee: new Currency(0.6 * opts.qty, 'DKK')
            });

            // Antifraud: setup: 495 DKK; 49 pr. måned
            // Recurring: setup: 495 DKK; 49 pr. måned
        }
    },
    {
        name: 'DIBS Medium',
        logo: 'dibs.svg',
        link: 'http://dibs.dk',
        features: ['antifraud', 'recurring'],
        cards: ['dankort', 'visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners', 'unionpay', 'mobilepay'],
        acqs: ['nets', 'teller', 'swedbank', 'handelsbanken', 'valitor', 'elavon'],
        setup: new Currency(4995, 'DKK'),
        monthly: new Currency(499, 'DKK'),
        calc(o) {
            o.trn.push({
                name: 'DIBS',
                info: '0,55 DKK pr. transaktion',
                fee: new Currency(0.55 * opts.qty, 'DKK')
            });
        }
    },
    {
        name: 'DIBS Premium',
        logo: 'dibs.svg',
        link: 'http://dibs.dk',
        features: ['antifraud', 'recurring'],
        cards: ['dankort', 'visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners', 'unionpay', 'mobilepay', 'forbrugsforeningen'],
        acqs: ['nets', 'teller', 'swedbank', 'handelsbanken', 'valitor', 'elavon'],
        setup: new Currency(10995, 'DKK'),
        monthly: new Currency(899, 'DKK'),
        calc(o) {
            o.trn.push({
                name: 'DIBS',
                info: '0,5 DKK pr. transaktion',
                fee: new Currency(0.5 * opts.qty, 'DKK')
            });
        }
    },
    {
        name: 'ePay Light',
        logo: 'epay.svg',
        link: 'http://epay.dk',
        features: ['antifraud'],
        cards: ['dankort', 'mobilepay', 'forbrugsforeningen'],
        acqs: ['nets'],
        setup: new Currency(399, 'DKK'),
        monthly: new Currency(99, 'DKK'),
        calc(o) {
            // 0.25 DKK per transaction (250 free per month)
            o.trn.push({
                name: 'ePay',
                info: '0,25 DKK pr. transaktion',
                fee: new Currency(0.25 * opts.qty, 'DKK')
            });

            const freeTransactions = Math.min(opts.qty, 250);
            o.trn.push({
                name: 'ePay',
                info: freeTransactions + ' gratis transaktioner',
                fee: new Currency(-0.25 * freeTransactions, 'DKK')
            });
            // Antifraud: 0,3 DKK pr. transaktion
        }
    },
    {
        name: 'ePay Pro',
        logo: 'epay.svg',
        link: 'http://epay.dk',
        features: ['antifraud'],
        cards: ['dankort', 'visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners', 'mobilepay', 'forbrugsforeningen'],
        acqs: ['nets', 'teller', 'clearhaus', 'swedbank', 'handelsbanken', 'valitor', 'elavon', 'bambora'],
        setup: new Currency(599, 'DKK'),
        monthly: new Currency(199, 'DKK'),
        calc(o) {
            // 0.25 DKK per transaction (250 free per month)
            o.trn.push({
                name: 'ePay',
                info: '0,25 DKK pr. transaktion',
                fee: new Currency(0.25 * opts.qty, 'DKK')
            });

            const freeTransactions = Math.min(opts.qty, 250);
            o.trn.push({
                name: 'ePay',
                info: freeTransactions + ' gratis transaktioner',
                fee: new Currency(-0.25 * freeTransactions, 'DKK')
            });
            // Antifraud: 0,3 DKK pr. transaktion
        }
    },
    {
        name: 'ePay Business',
        logo: 'epay.svg',
        link: 'http://epay.dk',
        features: ['antifraud', 'recurring'],
        cards: ['dankort', 'visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners', 'mobilepay', 'forbrugsforeningen'],
        acqs: ['nets', 'teller', 'clearhaus', 'swedbank', 'handelsbanken', 'valitor', 'elavon', 'bambora'],
        setup: new Currency(999, 'DKK'),
        monthly: new Currency(299, 'DKK'),
        calc(o) {
            // 0.25 DKK per transaction (500 free per month)
            o.trn.push({
                name: 'ePay',
                info: '0,25 DKK pr. transaktion',
                fee: new Currency(0.25 * opts.qty, 'DKK')
            });

            const freeTransactions = Math.min(opts.qty, 500);
            o.trn.push({
                name: 'ePay',
                info: freeTransactions + ' gratis transaktioner',
                fee: new Currency(-0.25 * freeTransactions, 'DKK')
            });
            // Antifraud: 0,3 DKK pr. transaktion
        }
    },
    {
        name: 'ePay Pro+', // Bambora
        logo: 'epay.svg',
        link: 'http://www.epay.dk/bambora/',
        features: ['antifraud'],
        cards: ['visa', 'mastercard', 'maestro'],
        monthly: new Currency(149, 'DKK'),
        calc(o) {
            // 1.45% + 0.25 DKK per transaction (250 free per month)
            o.trn.push({
                name: 'ePay',
                info: '1,45% + 0,25 DKK pr. transaktion',
                fee: opts.total.scale(1.45 / 100).add(new Currency(0.25 * opts.qty, 'DKK'))
            });

            const freeTransactions = Math.min(opts.qty, 250);
            o.trn.push({
                name: 'ePay',
                info: freeTransactions + ' gratis transaktioner',
                fee: new Currency(-0.25 * freeTransactions, 'DKK')
            });
        }
    },
    {
        name: 'Netaxept Start',
        logo: 'netaxept.svg',
        link: 'https://shop.nets.eu/da/web/dk/e-commerce',
        features: [],
        cards: ['dankort', 'visa', 'mastercard', 'maestro'],
        acqs: ['nets', 'teller'],
        setup: new Currency(1005, 'DKK'),
        monthly: new Currency(180, 'DKK'),
        calc(o) {
            o.trn.push({
                name: 'Netaxept',
                info: '1,5 DKK pr. transaktion',
                fee: new Currency(1.5 * opts.qty, 'DKK')
            });
        }
    },
    {
        name: 'Netaxept Advanced',
        logo: 'netaxept.svg',
        link: 'https://shop.nets.eu/da/web/dk/e-commerce',
        features: ['antifraud', 'recurring'],
        cards: ['dankort', 'visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners'],
        acqs: ['nets', 'teller', 'swedbank', 'elavon'],
        setup: new Currency(6000, 'DKK'),
        monthly: new Currency(500, 'DKK'),
        calc(o) {
            o.trn.push({
                name: 'Netaxept',
                info: '0,7 DKK pr. transaktion',
                fee: new Currency(0.7 * opts.qty, 'DKK')
            });
            // Antifraud cost: 0.25 DKK
            // Dynamic 3-D secure: 0.25 DKK
            // Recurring: 250 DKK / month
        }
    },
    {
        name: 'Payer',
        logo: 'payer.svg',
        link: 'http://payer.se/betallosning/',
        features: ['antifraud'],
        cards: ['visa', 'mastercard', 'maestro', 'amex', 'diners'],
        acqs: ['swedbank', 'handelsbanken'],
        setup: new Currency(1400, 'SEK'),
        monthly: new Currency(400, 'SEK'),
        calc(o) {
            o.trn.push({
                name: 'Payer',
                info: '2 SEK pr. transaktion',
                fee: new Currency(2 * opts.qty, 'SEK')
            });
        }
    },
    {
        name: 'Paylike',
        logo: 'paylike.svg',
        link: 'https://paylike.io',
        features: ['antifraud'],
        cards: ['visa', 'mastercard', 'maestro'],
        calc(o) {
            o.trn.push({
                name: 'Paylike',
                info: '2,5% + 0,25 EUR pr. transaktion',
                fee: opts.total.scale(2.5 / 100).add(new Currency(0.25 * opts.qty, 'EUR'))
            });
        }
    },
    {
        name: 'Paymill',
        logo: 'paymill.svg',
        link: 'https://paymill.com',
        features: ['antifraud', 'recurring'],
        cards: ['visa', 'mastercard', 'maestro', 'amex', 'jcb', 'unionpay', 'diners'],
        calc(o) {
            o.trn.push({
                name: 'Paymill',
                info: '2,95% + 0,28 EUR pr. transaktion',
                fee: opts.total.scale(2.95 / 100).add(new Currency(0.28 * opts.qty, 'EUR'))
            });
        }
    },
    {
        name: 'PayPal',
        logo: 'paypal.svg',
        link: 'https://www.paypal.com/dk/webapps/mpp/merchant',
        features: ['antifraud'],
        cards: ['visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners'],
        calc(o) {
            // https://www.paypal.com/dk/webapps/mpp/paypal-fees
            const k = opts.total.dkk() / 1000;
            const fee = (k <= 20) ? 3.4 : (k <= 80) ? 2.9 : (k <= 400) ? 2.7 : (k <= 800) ? 2.4 : 1.9;
            //console.log(fee.toString.replace('.', ','));
            o.trn.push({
                name: 'PayPal',
                info: fee + '% + 2,6 DKK pr. transaktion',
                fee: opts.total.scale(fee / 100).add(new Currency(2.6 * opts.qty, 'DKK'))
            });
        }
    },
    {
        name: 'Payson',
        logo: 'payson.png',
        link: 'https://www.payson.se',
        features: ['antifraud'],
        cards: ['visa', 'mastercard', 'maestro'],
        calc(o) {
            // 2.85% (min. 4.5 SEK) TODO: add minimum fee
            o.trn.push({
                name: 'Payson',
                info: '2,85% (min. 4,5 SEK) pr. transaktion',
                fee: opts.total.scale(2.85 / 100)
            });
        }
    },
    {
        name: 'Payza',
        logo: 'payza.svg',
        link: 'https://payza.com',
        features: ['antifraud'],
        cards: ['visa', 'mastercard', 'maestro'],
        calc(o) {
            o.trn.push({
                name: 'Payza',
                info: '2,9% + 0,3 EUR pr. transaktion',
                fee: opts.total.scale(2.9 / 100).add(new Currency(0.3 * opts.qty, 'EUR'))
            });
        }
    },
    {
        name: 'QuickPay Basis',
        logo: 'quickpay.svg',
        link: 'https://quickpay.net/dk',
        features: ['antifraud', 'recurring'],
        cards: ['dankort', 'visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners', 'unionpay', 'mobilepay', 'forbrugsforeningen'],
        acqs: ['nets', 'teller', 'clearhaus'],
        calc(o) {
            o.trn.push({
                name: 'QuickPay',
                info: '5 DKK pr. transaktion',
                fee: new Currency(5 * opts.qty, 'DKK')
            });
        }
    },
    {
        name: 'QuickPay Starter',
        logo: 'quickpay.svg',
        link: 'https://quickpay.net/dk',
        features: ['antifraud', 'recurring'],
        cards: ['dankort', 'visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners', 'unionpay', 'mobilepay', 'forbrugsforeningen'],
        acqs: ['nets', 'teller', 'clearhaus'],
        monthly: new Currency(49, 'DKK'),
        calc(o) {
            o.trn.push({
                name: 'QuickPay',
                info: '1 DKK pr. transaktion',
                fee: new Currency(opts.qty, 'DKK')
            });
        }
    },
    {
        name: 'QuickPay Professional',
        logo: 'quickpay.svg',
        link: 'https://quickpay.net/dk',
        features: ['antifraud', 'recurring'],
        cards: ['dankort', 'visa', 'mastercard', 'maestro', 'amex', 'jcb', 'diners', 'unionpay', 'mobilepay', 'forbrugsforeningen'],
        acqs: ['nets', 'teller', 'clearhaus'],
        monthly: new Currency(149, 'DKK'),
        calc(o) {
            // 0.25 DKK per transaction (250 free per month)
            o.trn.push({
                name: 'QuickPay',
                info: '0,25 DKK pr. transaktion',
                fee: new Currency(0.25 * opts.qty, 'DKK')
            });

            const freeTransactions = Math.min(opts.qty, 250);
            o.trn.push({
                name: 'QuickPay',
                info: freeTransactions + ' gratis transaktioner',
                fee: new Currency(-0.25 * freeTransactions, 'DKK')
            });
        }
    },
    {
        name: 'Stripe',
        logo: 'stripe.svg',
        link: 'https://stripe.com',
        features: ['antifraud', 'recurring'],
        cards: ['visa', 'mastercard', 'amex'],
        calc(o) {
            o.trn.push({
                name: 'Stripe',
                info: '1,4% + 1,8 DKK pr. transaktion',
                fee: opts.total.scale(1.4 / 100).add(new Currency(1.8 * opts.qty, 'DKK'))
            });
        }
    },
    {
        name: 'YourPay',
        logo: 'yourpay.png',
        link: 'https://www.yourpay.io',
        features: ['antifraud'],
        cards: ['visa', 'mastercard', 'maestro'],
        calc(o) {
            o.trn.push({
                name: 'YourPay',
                info: '2,25% pr. transaktion',
                fee: opts.total.scale(2.25 / 100)
            });
        }
    },
    {
        name: '2checkout',
        logo: '2checkout.svg',
        link: 'https://www.2checkout.com',
        features: ['antifraud', 'recurring'],
        cards: ['visa', 'mastercard', 'maestro', 'amex', 'jcb', 'unionpay', 'diners'],
        calc(o) {
            o.trn.push({
                name: '2Checkout',
                info: '2,4% + 0,3 USD pr. transaktion',
                fee: opts.total.scale(2.4 / 100).add(new Currency(0.3 * opts.qty, 'USD'))
            });
        }
    },
    {
        name: 'PayEx One',
        logo: 'payex.svg',
        link: 'http://payex.dk/tjenester/e-handel/',
        features: ['antifraud', 'recurring'],
        cards: ['visa', 'mastercard', 'maestro', 'mobilepay'],
        monthly: new Currency(299, 'DKK'),
        calc(o) {
            o.trn.push({
                name: 'PayEx',
                info: '1% + 1,5 DKK pr. transaktion',
                fee: opts.total.scale(1 / 100).add(new Currency(1.5 * opts.qty, 'DKK'))
            });
        }
    },
    {
        name: 'Wannafind',
        logo: 'wannafind.svg',
        link: 'https://www.wannafind.dk/betalingssystem/',
        features: ['antifraud', 'recurring'],
        cards: ['dankort', 'visa', 'mastercard', 'maestro', 'amex', 'jcb', 'unionpay', 'diners', 'mobilepay', 'forbrugsforeningen'],
        acqs: ['nets', 'teller'],
        monthly: new Currency(149, 'DKK'),
        calc(o) {
            o.monthly.push({
                name: '+ 3-D Secure',
                info: '49 DKK pr. måned',
                fee: new Currency(49, 'DKK')
            });

            if (opts.features.recurring) {
                o.monthly.push({
                    name: '+ Abonnementbetalinger',
                    info: '99 DKK pr. måned',
                    fee: new Currency(99, 'DKK')
                });
            }
        }
    },
    {
        name: 'PensoPay Basis',
        logo: 'pensopay.svg',
        link: 'https://pensopay.com/',
        features: ['antifraud'],
        cards: ['visa', 'mastercard', 'maestro', 'mobilepay'],
        calc(o) {
            o.trn.push({
                name: 'PensoPay',
                info: '1,45% + 5 DKK pr. transaktion',
                fee: opts.total.scale(1.45 / 100).add(new Currency(5 * opts.qty, 'DKK'))
            });
        }
    },
    {
        name: 'PensoPay Iværksætter',
        logo: 'pensopay.svg',
        link: 'https://pensopay.com/',
        features: ['antifraud', 'recurring'],
        cards: ['visa', 'mastercard', 'maestro', 'mobilepay'],
        monthly: new Currency(59, 'DKK'),
        calc(o) {
            o.trn.push({
                name: 'PensoPay',
                info: '1,45% + 1 DKK pr. transaktion',
                fee: opts.total.scale(1.45 / 100).add(new Currency(opts.qty, 'DKK'))
            });

            if (opts.features.recurring) {
                o.trn.push({
                    name: '+ Abonnementbetalinger',
                    info: '0,2 DKK pr. transaktion',
                    fee: new Currency(0.20 * opts.qty, 'DKK')
                });
            }
        }
    },
    {
        name: 'PensoPay Business',
        logo: 'pensopay.svg',
        link: 'https://pensopay.com/vores-betalingsloesninger/',
        features: ['antifraud', 'recurring'],
        cards: ['visa', 'mastercard', 'maestro', 'mobilepay'],
        monthly: new Currency(99, 'DKK'),
        calc(o) {
            // 1.4% + 0.35 DKK (100 free transactions)
            o.trn.push({
                name: 'PensoPay',
                info: '1,4% + 0,35 DKK pr. transaktion',
                fee: opts.total.scale(1.4 / 100).add(new Currency(0.35 * opts.qty, 'DKK'))
            });

            const freeTransactions = Math.min(opts.qty, 100);
            o.trn.push({
                name: 'PensoPay',
                info: freeTransactions + ' gratis transaktioner',
                fee: new Currency(-0.35 * freeTransactions, 'DKK')
            });
        }
    },
    {
        name: 'PensoPay Pro',
        logo: 'pensopay.svg',
        link: 'https://pensopay.com/',
        features: ['antifraud', 'recurring'],
        cards: ['visa', 'mastercard', 'maestro', 'mobilepay'],
        monthly: new Currency(149, 'DKK'),
        calc(o) {
            // 1.35% + 0.25 DKK (250 free transactions)
            o.trn.push({
                name: 'PensoPay',
                info: '1,35% + 0,25 DKK pr. transaktion',
                fee: opts.total.scale(1.35 / 100).add(new Currency(0.25 * opts.qty, 'DKK'))
            });

            const freeTransactions = Math.min(opts.qty, 250);
            o.trn.push({
                name: 'PensoPay',
                info: freeTransactions + ' gratis transaktioner',
                fee: new Currency(-0.25 * freeTransactions, 'DKK')
            });
        }
    },
    {
        name: 'Reepay Startup',
        logo: 'reepay.svg',
        link: 'https://reepay.com/da/',
        features: ['recurring'],
        cards: ['visa', 'mastercard', 'maestro'],
        acqs: ['clearhaus'],
        monthly: new Currency(99, 'DKK'),
        calc(o) {
            if (!opts.features.recurring) { return false; }
            o.trn.push({
                name: 'Reepay',
                info: '4 DKK pr. transaktion',
                fee: new Currency(4 * opts.qty, 'DKK')
            });
        }
    },
    {
        name: 'Reepay Medium',
        logo: 'reepay.svg',
        link: 'https://reepay.com/da/',
        features: ['recurring'],
        cards: ['visa', 'mastercard', 'maestro'],
        acqs: ['clearhaus'],
        monthly: new Currency(199, 'DKK'),
        calc(o) {
            if (!opts.features.recurring) { return false; }
            o.trn.push({
                name: 'Reepay',
                info: '2 DKK pr. transaktion',
                fee: new Currency(2 * opts.qty, 'DKK')
            });
        }
    },
    {
        name: 'Reepay Enterprise',
        logo: 'reepay.svg',
        link: 'https://reepay.com/da/',
        features: ['recurring'],
        cards: ['visa', 'mastercard', 'maestro'],
        acqs: ['clearhaus'],
        monthly: new Currency(949, 'DKK'),
        calc(o) {
            if (!opts.features.recurring) { return false; }
            o.trn.push({
                name: 'Reepay',
                info: '1,5 DKK pr. transaktion',
                fee: new Currency(1.5 * opts.qty, 'DKK')
            });
        }
    },
    {
        name: 'Lemon Way',
        logo: 'lemonway.svg',
        link: 'https://reepay.com/da/',
        features: ['antifraud'],
        cards: ['visa', 'mastercard', 'maestro'],
        calc(o) {
            o.trn.push({
                name: 'Lemon Way',
                info: '1,2% + 0,18 EUR pr. transaktion',
                fee: opts.total.scale(1.2 / 100).add(new Currency(0.18 * opts.qty, 'EUR'))
            });
        }
    }
];
