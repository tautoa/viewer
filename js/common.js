/*jslint browser: true*/
/*global $, jQuery, alert*/

var COMMON = COMMON || {};

COMMON.Enum = function () {
    "use strict";
    var keys = $.map(arguments, function (value) {return value; }),
        self = {keys: keys},
        i;

    for (i = 0; i < arguments.length; i += 1) {
        self[keys[i]] = i;
    }

    return self;
};