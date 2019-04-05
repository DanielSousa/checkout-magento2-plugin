define([
        'jquery',
        'Magento_Checkout/js/view/payment/default',
        'CheckoutCom_Magento2/js/view/payment/utilities',
        'Magento_Checkout/js/model/full-screen-loader',
        'Magento_Checkout/js/model/payment/additional-validators',
        'framesjs'
    ],
    function ($, Component, Utilities, FullScreenLoader, AdditionalValidators) {

        'use strict';

        window.checkoutConfig.reloadOnBillingAddress = true; // Fix billing address missing.
        const CODE = Utilities.getCardPaymentCode();

        return Component.extend(
            {
                defaults: {
                    template: 'CheckoutCom_Magento2/payment/' + CODE
                },

                /**
                 * @returns {exports}
                 */
                initialize: function () {
                    this._super();
                },

                initObservable: function () {
                    this._super().observe([]);
                    return this;
                },


                /**
                 * Getters and setters
                 */

                /**
                 * @returns {string}
                 */
                getCode: function () {
                    return CODE;
                },

                /**
                 * @returns {bool}
                 */
                isActive: function () {
                    return true;
                },

                /**
                 * @returns {boolean}
                 */
                isAvailable: function () {
                    return true;
                },

                /**
                 * @returns {boolean}
                 */
                isPlaceOrderActionAllowed: function () {
                    return true;
                },


                /**
                 * Events
                 */

                /**
                 * Content visible
                 *
                 * @return     {boolean}
                 */
                contentVisible: function() {

                    var $btnSubmit = $('#ckoCardTargetButton'),
                        $frame = $('.frames-container'),
                        self =  this;

                    // Disable button
                    Utilities.enableSubmit(CODE, false);

                    // Remove any existing event handlers
                    Frames.removeAllEventHandlers(Frames.Events.CARD_VALIDATION_CHANGED);
                    Frames.removeAllEventHandlers(Frames.Events.CARD_TOKENISED);
                    Frames.removeAllEventHandlers(Frames.Events.FRAME_ACTIVATED);

                    Frames.init({
                        publicKey: Utilities.getValue(CODE, 'public_key'),
                        //publicKey: 'pk_78d1c4d6-8a05-4a61-a346-de32ae5df932', // @todo: refuse amex
                        containerSelector: '.frames-container',
                        debugMode: Utilities.getValue(CODE, 'debug', false),

                        billingDetails: Utilities.getBillingAddress(),
                        customerName: Utilities.getCustomerName(),

                        theme: Utilities.getValue(CODE, 'theme', 'standard'),
                        themeOverride: Utilities.getValue(CODE, 'themeOverride'),

                        localisation: Utilities.getValue(CODE, 'localisation', 'EN-GB'),

                        cardValidationChanged: function() {
                            Utilities.enableSubmit(CODE, Frames.isCardValid());
                        },
                        cardTokenised: self.request.bind(self),
                        cardTokenisationFailed: self.handleFail.bind(self)

                    });

                    return true;

                },

                /**
                 * @returns {void}
                 */
                placeOrder: function () {

                    // Start the loader
                    FullScreenLoader.startLoader();
                    // Validate before submission
                    if (AdditionalValidators.validate()) {
                        Frames.submitCard();
                     //   return true;
                    } else {
                        this.handleFail({}); //@todo: imrpove needed
                        FullScreenLoader.stopLoader();
                    }

                    return false;

                },


                /**
                 * HTTP handlers
                 */

                /**
                 * @returns {string}
                 */
                request: function (res) {

                    Utilities.placeOrder({
                        type: 'token',
                        token: res.data.cardToken

                    },
                    this.handleSuccess,
                    this.handleFail);

                },

                handleSuccess: function(res) {
console.log(res);
                    FullScreenLoader.stopLoader();
                },

                handleFail: function(res) {
console.log(res);
                    Frames.unblockFields();
                    FullScreenLoader.stopLoader();
                }

            }
        );
    }
);