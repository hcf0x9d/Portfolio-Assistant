/**
 * Meet Scribbles:
 *
 * Scribbles is Jason's personal web assistant.  Scribbles' sole purpose is to meet people online and answer their
 * questions, either well, or extremely poorly.
 *
 * #TheTruthIsPublicDomain
 */

let recognition = null;

class ScribblesAssistant {

    constructor() {

        // Setup the model
        this.accessToken = "ab9dd0fc3b4a433a996a546ff071fcbc";
        this.apiUrl = "https://api.api.ai/v1/";
        this.sessionId = Math.random().toString( 36 ).substring( 7 );
        this.cookieName = "jfai_scribbs";

        // Some inputs that we will need
        this.textInputEl = document.getElementById( 'input' );
        this.voiceInputEl = document.getElementById( 'rec' );

        // If the cookie doesn't exist, create it, otherwise, grab the old sessionId.
        if ( cookieMonster( 'get', this.cookieName ) ) {

            this.sessionId = cookieMonster( 'get', this.cookieName );

        } else {

            cookieMonster( 'store', this.cookieName, this.sessionId, 10000 );

        }

        this.eventHandler();
        this.sprite();

    }

    eventHandler () {

        this.textInputEl.addEventListener( 'keypress', ( e ) => {

            // On `return`, prevent the default action and send the text content
            if ( e.which === 13 ) {

                e.preventDefault();
                this.send();

            }

        } );

        this.voiceInputEl.addEventListener( 'click', () => this.switchRecognition() );

    };

    /**
     * This uses the webkit voice input handler built in.  Need a polyfil for other browsers.
     */
    startRecognition () {

        recognition = new webkitSpeechRecognition();// jscs:ignore requireCapitalizedConstructors

        // Instantiate the webkit speech recognition
        // noinspection JSUnresolvedFunction
        recognition.onstart = () => this.updateRec();

        recognition.onresult = e => {

            let text = '';

            // noinspection JSUnresolvedVariable
            for( let i = e.resultIndex; i < e.results.length; ++i ) {

                // noinspection JSUnresolvedVariable
                text += e.results[i][0].transcript;

            }

            this.setInput( text );
            this.stopRecognition();

        };
        recognition.onend = () => this.stopRecognition();

        recognition.lang = "en-US";
        recognition.start();

    };

    stopRecognition () {

        if ( recognition ) {

            recognition.stop();
            recognition = null;

        }

        this.updateRec();

    };

    /**
     * Change the recognition function -> start/stop
     */
    switchRecognition () {

        recognition ? this.stopRecognition() : this.startRecognition();

    }

    setInput ( text ) {

        this.textInputEl.text = text;

        this.send();

    };

    /**
     * Change the contents of the voice input button -> speak/stop
     */
    updateRec () {

        this.voiceInputEl.classList = recognition ? "record-button active" : "record-button";

    }

    /**
     * API.AI call happens here
     *
     * Send the request to API.AI to handle the AI portion of things.
     *
     * @returns {object}
     */
    send () {

        let text = this.textInputEl.value;
        const url = `${this.apiUrl}query/`;

        $.ajax( {
            type        : "POST",
            url,
            contentType : "application/json; charset=utf-8",
            dataType    : "json",
            headers     : {
                Authorization : `Bearer ${this.accessToken}`,
            },
            data        : JSON.stringify( { q : text, lang : "en", sessionId : this.sessionId, } ),

            success     :  data => {

                const knownActions = [ 'github', 'weather', ];

                if ( data.result ) {

                    let action = data.result.action;

                    // noinspection JSUnresolvedVariable
                    knownActions.includes( action ) ? this.setupAnotherAPICall( data.result ) :
                        this.setResponse( data.result.speech );

                }

            },
            error       : () => this.setResponse( "Internal Server Error" ),
        } );

        // Kick off a loading function
        this.setResponse( this.textInputEl.value, "client" );

    };

    setupAnotherAPICall ( request ) {

        let api = '';

        if ( request.action === 'github' ) {

            api = "https://api.github.com/users/jfukura/events/public";

            this.getAnotherAPI( request.action, api );

        } else if ( request.action === 'weather' ) {

            const city = request.parameters.address.city ? request.parameters.address.city : 'Kingston, Washington';

            api = `https://query.yahooapis.com/v1/public/yql?q=select item.condition from weather.forecast 
                            where woeid in (select woeid from geo.places(1) where text='${city}')&format=json`;

            this.getAnotherAPI( request.action, api );

        }

    };
    /**
     * Set the response of the API into the application and handle it.
     * Build a response element (like a speech bubble)
     *
     * @param {string} response - Text or HTML string to be shown to the client
     * @param {string} speaker - The entity that is currently doing the talking
     */
    setResponse ( response, speaker = 'api' ) {

        $( "#response" ).append( `<li class="item ${speaker}"><span class="bubble">${response}</span></li>` );

        $( '.item:last', '#response' ).css( {
            opacity : 0,
        } ).animate( {
            opacity : 1,
        }, 250 );

        speaker === 'api' ? this.talkRoutine() : false;

    };

    getAnotherAPI ( action, url ) {

        $.ajax( {

            type    : "GET",
            url,
            success : data => {

                setTimeout( () => {

                    this.setResponse( formatResponse( data ) );

                }, 500 );

            },
            error   : () => this.setResponse( "Internal Server Error" ),

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
                title = '';

            // Parsing all of GitHub's responses
            if ( action === 'github' ) {

                title = 'Recent GitHub Action';
                el = `<a class="subheadline" href="https://github.com/jfukura" target="_blank">${title}</a>`;

                obj.forEach( function ( el ) {

                    if ( !data[el.repo.name] ) {

                        data[el.repo.name] = 1;

                    } else {

                        data[el.repo.name]++

                    }

                    count++;

                } );

                Object.keys( data ).forEach( repo => {

                    el += `<span class="graphItem">` +
                        `<a href="https://github.com/${ repo }" target="_blank" class="legend">${ repo }</a>` +
                        `<span class="bar" style="width: ${ data[repo] / count * 100 }%"></span>` +
                        `</span>`;

                } );

                return el;

            } else if ( action === 'weather' ) {

                // noinspection JSUnresolvedVariable
                let res = obj.query.results.channel.item.condition;

                // noinspection JSUnresolvedVariable
                return `<li class="item api">` +
                            `<span class="bubble">It is currently ${res.text} and ${res.temp} degrees</span>` +
                        `</li>`;

            }

        }

    };

    sprite () {

        let timer = null,
            eyeTime = null,
            talkTimer = null,
            patRoutine;         // Function

        const head = document.getElementById( 'Head' ),
            openEyes = document.getElementsByClassName( 'eye-open' ),
            smileEyes = document.getElementsByClassName( 'eye-half' ),
            beak = document.getElementById( 'Beak' );

        head.addEventListener( 'click', () => patRoutine() );

        this.talkRoutine = () => {

            beak.classList = 'anim-talk-beak';

            talkTimer = setTimeout( () => {

                beak.classList = '';
                talkTimer = null;

            }, 2000 );

            // Occasionally we will run a patRoutine while talking
            if ( Math.floor( Math.random() * 4 ) + 1 === 3 ) {

                patRoutine();

            } else if ( Math.floor( Math.random() * 4 ) + 1 === 4 ) {

                patRoutine( 'alt' );

            }

        };

        /**
         * When we pat the bird, do something cute
         */
        patRoutine = ( routine ) => {

            if ( routine !== 'alt' ) {

                head.classList = 'owl-head anim-head-pat';

                openEyes[0].classList = 'eye-open is-off';
                openEyes[1].classList = 'eye-open is-off';

                smileEyes[0].classList = 'eye-half anim-eye-blink';
                smileEyes[1].classList = 'eye-half anim-eye-blink';

            } else {

                head.classList = 'owl-head anim-head-pat-alt';

            }

            timer = setTimeout( () => {

                head.classList = 'owl-head anim-head';
                timer = null;

            }, 2000 );

            eyeTime = setTimeout( () => {

                openEyes[0].classList = 'eye-open anim-eye-blink';
                openEyes[1].classList = 'eye-open anim-eye-blink';

                smileEyes[0].classList = 'eye-half is-off';
                smileEyes[1].classList = 'eye-half is-off';

                eyeTime = null;

            }, 5000 );

        }

    };

}

/**
 * Cookie Handler Function!
 *
 * @param  {string} action Store, Get or Destroy
 * @param  {string} name   Name that cookie
 * @param  {string} value  The stringified content for the cookie (consider B64)
 * @param  {number} days  Number of days to set for expiry of the cookie (optional)
 */
function cookieMonster ( action, name, value = '', days = 0 ) {

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

    const scribbles = new ScribblesAssistant();

};
