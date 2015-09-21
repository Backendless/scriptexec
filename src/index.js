process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'; //fix for https

var express = require( 'express' );
var app = express();
app.listen( process.argv[2], '0.0.0.0' );

var timeout = process.argv[3];
var serverUrl = process.argv[4];
var applicationId = process.argv[5];
var secretKey = process.argv[6];
var version = process.argv[7];

global.Backendless = require( './backendless' );
Backendless.serverURL = serverUrl;
Backendless.initApp( applicationId, secretKey, version );

var bodyParser = require( 'body-parser' );
app.use( bodyParser.text( {type: '*/*'} ) );
app.disable( 'x-powered-by' );

var listenerSet = false;
var scriptpath;
var code;
var onUncaughtExceptionListener;

app.all( '*', function ( request, response )
{
    try
    {
        scriptpath = '/repo' + request.path;

        delete require.cache[require.resolve( scriptpath )]; // clean cache for this entry to be loaded again
        code = require( scriptpath ); // execute user's method

        // shutdown in 5 seconds if function is being executed more than this time
        // works for non-blocking operations only!
        if( typeof timeout == 'number')
        {
            setTimeout( function ()
                        {
                            if( !response.headersSent )
                            {
                                response.status( 504 ).send( {
                                    'code': 6020,
                                    'message': "Script has timed out before producing a response. Script URL - " + scriptpath
                                } );
                            }
                        }, timeout * 1000 );
        }

        onUncaughtExceptionListener = onUncaughtExceptionListener || function (err)
        {
            console.log( "Uncaught exception: " + err.stack );

            if( !response.headersSent )
            {
                response.status( 503 ).send( err.name + ': ' + err.message );
            }
        };

        if( !listenerSet )
        {
            process.on( 'uncaughtException', onUncaughtExceptionListener );
            listenerSet = true;
        }

        code.run( request, response );
    }
    catch( e )
    {
        console.log( "Caught exception: " + e.stack );

        if( !response.headersSent )
        {
            response.status( 500 ).send( e.name + ': ' + e.message );
        }
    }
} );