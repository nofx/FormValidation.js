/*
 * FormValidation.js 1.0.0
 * Copyright (c) 2014 Simon Carbajal, simoncarbajal [at] gmail.com.
 * This software is open sourced under the MIT license.
 */

// TODO: Add the posibility to have custom error messages in each field.

function FormValidation(formId, validations, fieldsToValidate, callback) {
    // private instance members
    var _form;
    var _validations;
    var _fieldsToValidate;
    var _callback;
    var _onsubmit;

    if (!formId || !validations || !fieldsToValidate)
        throw new Error('FormValidation(): At least one parameter is undefined.');

    // check that the form exist and is valid
    _form = document.getElementById(formId);
    if (!_form)
        throw new Error('FormValidation(): Couldn\'t find form with id "' + formId + '".');

    // check that the validations provided are valid
    if (!validations)
        throw new Error('FormValidation(): You must provide at least 1 validation object.');
    _validations = validations;

    // check that the fields to validate are valid
    if (!fieldsToValidate)
        throw new Error('FormValidation(): You must provide at least 1 field object to validate.');
    _fieldsToValidate = fieldsToValidate;

    if (!callback)
        throw new Error('FormValidation(): You must provide at least 1 callback function.');
    if (typeof callback !== 'function')
        throw new Error('FormValidation(): The callback parameter is not a function.');
    if (callback.length !== 1)
        throw new Error('FormValidation(): The callback function signature must have only 1 parameter.');
    _callback = callback;

    // trigger the validation when the form is submited
    _onsubmit = _form.onsubmit;
    _form.onsubmit = (function(that) {
        return function() {
            return that.validateForm() && (!_onsubmit || _onsubmit());
        }
    })(this);

    // public methods
    this.getForm = function() { return _form; };

    this.getFieldsToValidate = function() { return _fieldsToValidate; };

    this.getValidationObject = function(validation) {
        if (!validation)
            throw new Error('getValidationObject(): wrong parameter.');

        var validationObject = _validations[validation];
        if (!validationObject)
            throw new Error('_callValidation(): The validation object "' + validationString + '" does not exist in the validations provided.');

        var validationFunction = validationObject.function;
        if (!validationFunction)
            throw new Error('_callValidation(): The validation object "' + validationString + '" must provide a validation function.');

        if (typeof validationFunction !== 'function' )
            throw new Error('_callValidation(): "' + validationString + '.function" is not a function.');

        return validationObject;
    };

    this.getCallback = function() { return _callback; };
}

// public methods
FormValidation.prototype.validateForm = function() {
    var that = this;
    var form = this.getForm();
    var fieldsToValidate = this.getFieldsToValidate();
    var fieldToValidate;
    var formField;
    var validationResult;
    var errors = [];

    function _fixType(value) {
        if (FormValidation.NUMBER_TYPE_REGEX.test(value))
            value = parseFloat(value);
        return value;
    }

    function _callValidation(field, validationString) {
        if (!field || !validationString)
            throw new Error('_callValidation(): Wrong parameters.');

        var parsedValidation = FormValidation.VALIDATION_REGEX.exec(validationString);
        if (!parsedValidation || parsedValidation.length != 3)
            throw new Error('Couldn\'t parse validation "' + validationString + '", submited in field "' + field.name + '".');

        var validationResult = {};
        var parameters = [field];
        var validation = parsedValidation[1];
        if (parsedValidation[2]) {
            validationResult.parameters = parsedValidation[2].split(',');

            // if the parameters are numbers, change its type to number
            for (var i = 0; i < validationResult.parameters.length; i++)
                validationResult.parameters[i] = _fixType(validationResult.parameters[i]);

            parameters = parameters.concat(validationResult.parameters);
        }

        // validationsObject == { validation_function: ... , error_message: ... }
        var validationObject = that.getValidationObject(validation);
        var validationFunction = validationObject.function;
        if (validationFunction.length != parameters.length)
            throw new Error('_callValidation(): "' + validationString + '.validation" function expects ' +
                (validationFunction.length - 1) + ' extra parameters. In field "' + field.name + '", you are trying to call "' +
                parsedValidation[0] + '" with ' + (parameters.length - 1) + ' parameters.');

        validationResult.isValid = validationFunction.apply(that, parameters);
        if (validationResult.isValid !== true)
            validationResult.raw_error_message = validationObject.error_message;

        return validationResult;
    };

    function _getErrorMessage(validationResult) {
        var errorMessage = validationResult.raw_error_message.replace('%field', fieldToValidate.name);

        if (validationResult.parameters)
            for (var i = 0; i < validationResult.parameters.length; i++)
                errorMessage = errorMessage.replace('%param' + i, validationResult.parameters[i]);

        return errorMessage;
    };

    // loop through the chosen fields to perform the selected validations
    for (var i in fieldsToValidate) {
        fieldToValidate = fieldsToValidate[i];
        formField = form[fieldToValidate.name];
        if (!formField) {
            console.log('validateForm(): Warning: The form with id "' + form.id
                + '", doesn\'t have the field with name "' + fieldToValidate.name + '".');
            continue;
        }

        validations = fieldToValidate.validations.split('|');
        for (var j in validations) {
            validationString = validations[j];
            validationResult = _callValidation(formField, validationString);
            if (!validationResult.isValid) {
                errors.push({
                    field_name: fieldToValidate.name,
                    field_object: fieldToValidate,
                    validation: validationString,
                    parameters: validationResult.parameters,
                    message: _getErrorMessage(validationResult)
                });
                // continue with the other fields
                break;
            }
        }
    }

    if (errors.length <= 0)
        return true;

    var callback = this.getCallback();
    callback(errors);
    return false;
}

// public static constants
FormValidation.VALIDATION_REGEX = /^([a-z_-]+)(?:\((.+)\))*$/;
FormValidation.NUMBER_TYPE_REGEX = /^-?[0-9]*\.?[0-9]+$/;

FormValidation.VALIDATIONS = {
    required: {
        function: function(field) {
            if (field.type === 'checkbox' || field.type === 'radio')
                return (field.checked === true);

            return (field.value);
        },
        error_message: 'The %field is required.'
    },
    alpha: {
        function: function(field) {
            return /^[a-z]*$/i.test(field.value);
        },
        error_message: 'The %field must include only alphabetic characters.'
    },
    extended_alpha: {
        function: function(field) {
            return /^[a-z\'áéíóúäëïöüàèìòùâêîôûç ]*$/i.test(field.value);
        },
        error_message: 'The %field must include only alphabetic characters.'
    },
    digits_between: {
        function: function(field, min, max) {
            if (min > max)
                throw new Error('The call digits_between(' + field.name + ','
                    + min + ',' + max + ') is wrong because min value is greater than max value.');
            if (!field.value && min == 0)
                return true;
            if (field.value.length < min || field.value.length > max)
                return false;
            return true;
        },
        error_message: 'The %field should have between %param0 and %param1 characters.'
    },
    email: {
        function: function(field) {
            return /^(.+@.+)*$/.test(field.value);
        },
        error_message: 'The e-mail is not correct.'
    },
    file_type: {
        function: function(field, types) {
            if (!field.value)
                return true;
            var fileTypesRegex = new RegExp('(' + types.replace(/ /g, '|') + ')$', 'i');
            return fileTypesRegex.test(field.value);
        },
        error_message: 'The file must have one of the following types: %param0.'
    }
};
