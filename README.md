FormValidation.js
=================

Javascript form validation made simple, unobtrusive and extensible.

##Getting started

1. **Setup a form**

    Your form must have an id and every field you want to validate needs to have a name:
    ```html
    <form id="your-form-id-here" action="registration.php" method="post" enctype="multipart/form-data">
        <input name="first-name" >
        <input name="last-name" >
        <input name="email" type="email" >
        <input name="image" type="file" >
    </form>
    ```

2. **Include the FormValidation.js file**

    ```html
    <script src="FormValidation.js" ></script>
    ```

3. **Initialize the object**
    ```html
    <script>
    var formValidation = new FormValidation(
        // the id of the form you need to validate
        'your-form-id-here',
    
        // the validation functions with their respective error messages
        FormValidation.VALIDATIONS,
    
        // fields to be validated with their respective validations
        [
            { name: 'first-name', validations: 'required|extended_alpha|digits_between(3,30)' },
            { name: 'last-name',  validations: 'extended_alpha|digits_between(0,30)' },
            { name: 'email',      validations: 'required|email|digits_between(3,100)' },
            { name: 'image',      validations: 'file_type(png jpeg jpg gif)' }
        ],
    
        // callback called when there is at least 1 validation failing
        function(errors) {
            // errors is an array of error objects, each of them holds information related to the particular
            // field that failed a validation. The information provided is:
            //     field_name
            //     field_object
            //     validation
            //     parameters
            //     message

            console.log(errors);
        }
    );
    </script>
    ```

4. **Enjoy validating your forms!**

## Customization

If you need to modify the validation functions or their respective error messages, just override FormValidation.VALIDATIONS with your own implementation, you can even make your own array of validations and
provide it in the constructor.
The following example overrides the error messages in dutch and adds a new validation:

```javascript

var validations = FormValidation.VALIDATIONS;

validations.required.error_message = 'De field is verplicht';
validations.digits_between.error_message = 'De %field moet tussen de %param0 en %param1 tekens hebben';
validations.extended_alpha.error_message = 'De %field moet alfabetische tekens hebben';
validations.email.error_message = 'De e-mail voldoet niet aan een juiste indeling';
validations.file_type.error_message = 'De foto moet png, gif, jpg of png zijn';

validations.new_validation = {
    function: function(field, param0, param1) {
        if (field.value == param0 || field.value > param1)
            return true;
        else
            return false;
    },
    error_message: 'The %field should be equal to %param0 or greater than %param1.'
}
```

## Notes

Your callback function is in charge of handling the errors, like for example, showing a message to the user.

##License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
