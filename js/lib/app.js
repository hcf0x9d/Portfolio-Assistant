/**
 * Meet Scribbles:
 *
 * Scribbles is Jason's personal web assistant.  Scribbles' sole purpose is to meet people online and answer their
 * questions, either well, or extremely poorly.
 *
 * #TheTruthIsPublicDomain
 */

const ScribblesAssistant = function () {

    const _this = this;
    let recognition = null;

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

            console.log( 'click' );
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

            let text = '';

            // noinspection JSUnresolvedVariable
            for( let i = e.resultIndex; i < e.results.length; ++i ) {

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

        let text = _this.textInputEl.value;

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

                if ( data.result ) {

                    // noinspection JSUnresolvedVariable
                    _this.setResponse( data.result.speech, 'api' );

                    if ( data.result.action === 'github' ) {

                        const api = "https://api.github.com/users/jfukura/events/public";

                        _this.getAnotherAPI( data.result.action, api );

                    } else if ( data.result.action === 'weather' ) {

                        const res = data.result;
                        let city = 'Kingston, Washington',
                            api;

                        // noinspection JSUnresolvedVariable
                        if ( res.parameters.address.city ) {

                            // noinspection JSUnresolvedVariable
                            city = res.parameters.address.city

                        }

                        api = `https://query.yahooapis.com/v1/public/yql?q=select item.condition from weather.forecast 
                            where woeid in (select woeid from geo.places(1) where text='${city}')&format=json`;

                        _this.getAnotherAPI( data.result.action, api );

                    }

                }

            },
            error : function () {

                _this.setResponse( "Internal Server Error" );

            },
        } );

        // Kick off a loading function
        _this.setResponse( _this.textInputEl.value, "client" );

    };

    /**
     * Set the response of the API into the application and handle it.
     * Build a response element (like a speech bubble)
     *
     * @param {string} response - Text or HTML string to be shown to the client
     * @param {string} speaker - The entity that is currently doing the talking
     */
    _this.setResponse = function ( response, speaker ) {

        $( "#response" ).append( '<li class="item ' + speaker + '"><span class="bubble">' + response + '</span></li>' );

        $( '.item:last', '#response' ).css( {
            opacity : 0,
        } ).animate( {
            opacity : 1,
        }, 250 );

        _this.talkRoutine();

    };

    _this.getAnotherAPI = function ( action, obj ) {

        $.ajax( {
            type : "GET",
            url : obj,
            success : function ( data ) {

                console.log( data );

                setTimeout( function () {

                    _this.setResponse( formatResponse( data ) );

                }, 500 );

            },
            error : function () {

                _this.setResponse( "Internal Server Error" );

            },
        } );

        /**
         * Private Method for formatting 3rd party APIs
         *
         * @param {Object} obj - Object response from API
         */
        function formatResponse ( obj ) {

            // TODO: Restructure this using ES6 code
            let data = {},
                count = 0,
                el = '',
                i;

            // Parsing all of GitHub's responses
            if ( action === 'github' ) {

                el = '<h2 class="subheadline"><a href="https://github.com/jfukura" target="_blank">' +
                    'Recent GitHub Action</a></h2>';

                // TODO: ES6 upgrade
                for( i = 0; i < obj.length; i++ ) {

                    if ( Object.keys( data ) ) {

                        const keys = Object.keys( data );

                        // noinspection JSUnresolvedVariable
                        if ( keys.includes( obj[i].repo.name ) ) {

                            // noinspection JSUnresolvedVariable
                            data[ obj[i].repo.name ] += 1;

                        } else {

                            // noinspection JSUnresolvedVariable
                            data[ obj[i].repo.name ] = 1;

                        }

                    }

                    count++;

                }

                for( i = 0; i < Object.keys( data ).length; i++ ) {

                    el += `<span class="graphItem">` +
                        `<span class="bar" style="width: ${ data[Object.keys( data )[i]] / count * 100 }%"></span>` +
                        `<a href="https://github.com/${ Object.keys( data )[i] }" target="_blank" class="legend">` +
                            `${ Object.keys( data )[i] }</a>` +
                        `</span>`;

                }

                return el;

            } else if ( action === 'weather' ) {

                // noinspection JSUnresolvedVariable
                let res = obj.query.results.channel.item.condition;

                // noinspection JSUnresolvedVariable
                return `<li class="item api">
                            <span class="bubble">It is currently ${res.text} and ${res.temp} degrees</span>
                        </li>`;

            }

        }

    };

};

ScribblesAssistant.prototype.sprite = function () {

    const _this = this;

    let timer = null,
        eyeTime = null,
        talkTimer = null;

    const head = document.getElementById( 'Head' ),
        openEyes = document.getElementsByClassName( 'eye-open' ),
        smileEyes = document.getElementsByClassName( 'eye-half' ),
        beak = document.getElementById( 'Beak' );

    head.addEventListener( 'click', function () {

        patRoutine();

    } );

    _this.talkRoutine = function () {

        beak.classList = 'anim-talk-beak';

        talkTimer = setTimeout( function () {

            beak.classList = '';
            talkTimer = null;

        }, 2000 );

        if ( Math.floor( Math.random() * 4 ) + 1  === 3 ) {

            patRoutine();

        } else if ( Math.floor( Math.random() * 4 ) + 1  === 4 ) {

            patRoutineAlt();

        }

    };

    function patRoutine () {

        head.classList = 'owl-head anim-head-pat';

        openEyes[0].classList = 'eye-open is-off';
        openEyes[1].classList = 'eye-open is-off';

        smileEyes[0].classList = 'eye-half anim-eye-blink';
        smileEyes[1].classList = 'eye-half anim-eye-blink';

        timer = setTimeout( function () {

            head.classList = 'owl-head anim-head';
            timer = null;

        }, 2000 );

        eyeTime = setTimeout( function () {

            openEyes[0].classList = 'eye-open anim-eye-blink';
            openEyes[1].classList = 'eye-open anim-eye-blink';

            smileEyes[0].classList = 'eye-half is-off';
            smileEyes[1].classList = 'eye-half is-off';

            eyeTime = null;

        }, 5000 );

    }

    function patRoutineAlt () {

        head.classList = 'owl-head anim-head-pat-alt';

        timer = setTimeout( function () {

            head.classList = 'owl-head anim-head';
            timer = null;

        }, 2000 );

    }

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

    let date = new Date(),
        expires = '';

    if ( action === 'store' ) {

        if ( days ) {

            date.setTime( date.getTime() + ( days * 24 * 60 * 60 * 1000 ) );

            // noinspection JSUnresolvedFunction
            expires = "; expires=" + date.toGMTString();

        }
        document.cookie = name + "=" + value + expires;

    } else if ( action === 'get' ) {

        let nameEQ = name + "=",
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

window.onload = function () {

    const s = new ScribblesAssistant();
    s.eventHandler();
    s.sprite();

    // $( '#response' ).css( 'bottom',  $('.messageWrap').height() - $( '#Beak' ).offset().top  )
    console.log();

};
