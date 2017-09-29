var ScribblesAssistant;

ScribblesAssistant = function () {

    var _this = this,
        recognition = null;

    // Setup the model
    _this.accessToken = "ab9dd0fc3b4a433a996a546ff071fcbc";
    _this.apiUrl = "https://api.api.ai/v1/";
    _this.sessionId = Math.random().toString( 36 ).substring( 7 );
    _this.cookieName = "jfai_scribbs";

    // Some inputs that we will need
    _this.textInputEl = document.getElementById( 'input' );
    _this.voiceInputEl = document.getElementById( 'rec' );

    // If the cookie doesn't exist, create it, otherwise, grab the old sessionId.
    if ( cookieMonster( 'get', _this.cookieName, '', 0 ) ) {

        _this.sessionId = cookieMonster( 'get', _this.cookieName, '', 0 );

    } else {

        cookieMonster( 'store', _this.cookieName, _this.sessionId, 10000 );

    }

    _this.eventHandler = function () {

        _this.textInputEl.addEventListener( 'keypress', function ( e ) {

            // On `return`, prevent the default action and send the text content
            if ( e.which === 13 ) {

                e.preventDefault();
                _this.send();

            }

        } );

        _this.voiceInputEl.addEventListener( 'click', function () {

            _this.switchRecognition();

        } );

    };

    /**
     * This uses the webkit voice input handler built in.  Need a polyfil for other browsers.
     */
    _this.startRecognition = function () {

        // Instantiate the webkit speech recognition
        // noinspection JSUnresolvedFunction
        recognition = new webkitSpeechRecognition();// jscs:ignore requireCapitalizedConstructors
        recognition.onstart = function () {

            _this.updateRec();

        };
        recognition.onresult = function ( e ) {

            var text = "";

            // noinspection JSUnresolvedVariable
            for( var i = e.resultIndex; i < e.results.length; ++i ) {

                // noinspection JSUnresolvedVariable
                text += e.results[i][0].transcript;

            }
            _this.setInput( text );
            _this.stopRecognition();

        };
        recognition.onend = function () {

            _this.stopRecognition();

        };
        recognition.lang = "en-US";
        recognition.start();

    };

    _this.stopRecognition = function () {

        if ( recognition ) {

            recognition.stop();
            recognition = null;

        }

        _this.updateRec();

    };

    /**
     * Change the recognition function -> start/stop
     */
    _this.switchRecognition = function () {

        if ( recognition ) {

            _this.stopRecognition();

        } else {

            _this.startRecognition();

        }

    };

    _this.setInput = function ( text ) {

        _this.textInputEl.value = text;

        _this.send();

    };

    /**
     * Change the contents of the voice input button -> speak/stop
     */
    _this.updateRec = function () {

        _this.voiceInputEl.innerHTML = recognition ? "Stop" : "Speak";

    };

    /**
     * API.AI call happens here
     *
     * Send the request to API.AI to handle the AI portion of things.
     *
     * @returns {object}
     */
    _this.send = function () {

        var text = _this.textInputEl.value;

        $.ajax( {
            type : "POST",
            url : _this.apiUrl + "query/",
            contentType : "application/json; charset=utf-8",
            dataType : "json",
            headers : {
                Authorization : "Bearer " + _this.accessToken,
            },
            data : JSON.stringify( { q : text, lang : "en", sessionId : _this.sessionId, } ),

            success : function ( data ) {

                _this.setResponse( JSON.stringify( data, undefined, 2 ) );

            },
            error : function () {

                _this.setResponse( "Internal Server Error" );

            },
        } );
        _this.setResponse( "Loading..." );

    };

    /**
     * Set the response of the API into the application and handle it.
     *
     * @param obj
     */
    _this.setResponse = function ( obj ) {

        // Temporary response handler
        $( "#response" ).text( obj );

    };

};

window.onload = function () {

    var s = new ScribblesAssistant();
    s.eventHandler();

};

/**
 * Cookie Handler Function!
 *
 * @param  {string} action Store, Get or Destroy
 * @param  {string} name   Name that cookie
 * @param  {string} value  The stringified content for the cookie (consider B64)
 * @param  {number} days  Number of days to set for expiry of the cookie (optional)
 */
function cookieMonster ( action, name, value, days ) {

    var date = new Date();

    'use strict';

    if ( action === 'store' ) {

        var expires = '';
        if ( days ) {

            date.setTime( date.getTime() + ( days * 24 * 60 * 60 * 1000 ) );

            // noinspection JSUnresolvedFunction
            expires = "; expires=" + date.toGMTString();

        }
        document.cookie = name + "=" + value + expires;

    } else if ( action === 'get' ) {

        var nameEQ = name + "=",
            ca = document.cookie.split( ';' ),
            i,
            c;

        for( i = 0; i < ca.length; i += 1 ) {

            c = ca[i];
            while( c.charAt( 0 ) === ' ' ) {

                c = c.substring( 1, c.length );

            }
            if ( c.indexOf( nameEQ ) === 0 ) {

                return c.substring( nameEQ.length, c.length );

            }

        }

    } else if ( action === 'destroy' ) {

        date.setTime( date.getTime() + ( -1 * 24 * 60 * 60 * 1000 ) );

        // noinspection JSUnresolvedFunction
        expires = "; expires=" + date.toGMTString();

        document.cookie = name + "=" + expires;

    }

}
