var child_process = require( 'child_process' );
var express = require( 'express' );
var bodyParser = require( 'body-parser' );
var app = express();

var revertRules = {};

app.use( bodyParser.json() );

app.post( '/restriction/:containerIp', function ( req, res )
{
    var containerIp = req.params.containerIp;
    var hosts = req.body.hosts;

    child_process.execSync( 'iptables -w -A FORWARD --src ' + containerIp + ' --dst 8.8.8.8 -j ACCEPT' );

    for( var i = 0; i < hosts.length; i++ )
    {
        child_process.execSync( 'iptables -w -A FORWARD --src ' + containerIp + ' --dst ' + hosts[i] + ' -j ACCEPT' );
    }

    child_process.execSync( 'iptables -w -A FORWARD --src ' + containerIp + ' -j REJECT --reject-with icmp-host-prohibited' );

    revertRules[containerIp] = {};
    revertRules[containerIp].allow = [];

    for( var j = 0; j < hosts.length; j++ )
    {
        revertRules[containerIp].allow.push( 'iptables -w -D FORWARD --src ' + containerIp + ' --dst ' + hosts[j] + ' -j ACCEPT' );
    }

    revertRules[containerIp].reject = 'iptables -w -D FORWARD --src ' + containerIp + ' -j REJECT --reject-with icmp-host-prohibited';

    res.end();
} );

app.delete( '/restriction/:containerIp', function ( req, res )
{
    var containerIp = req.params.containerIp;

    for( var i = 0; i < revertRules[containerIp].allow.length; i++ )
    {
        child_process.execSync( revertRules[containerIp].allow[i] );
    }

    child_process.execSync( revertRules[containerIp].reject );

    revertRules[containerIp] = {};

    res.end();
} );

app.post( '/restriction/:containerIp/remove', function ( req, res )
{
    var containerIp = req.params.containerIp;
    var host = req.body.host;

    if( revertRules[containerIp] )
    {
        for( var i = 0; i < revertRules[containerIp].allow.length; i++ )
        {
            if( revertRules[containerIp].allow[i].indexOf( host ) > -1 )
            {
                child_process.execSync( revertRules[containerIp].allow[i] )
            }
        }
    }

    res.end();
} );

app.post( '/restriction/:containerIp/add', function ( req, res )
{
    var containerIp = req.params.containerIp;
    var host = req.body.host;

    if( revertRules[containerIp] )
    {
        child_process.execSync( revertRules[containerIp].reject );

        child_process.execSync( 'iptables -w -A FORWARD --src ' + containerIp + ' --dst ' + host + ' -j ACCEPT' );
        child_process.execSync( 'iptables -w -A FORWARD --src ' + containerIp + ' -j REJECT --reject-with icmp-host-prohibited' );

        revertRules[containerIp].allow.push( 'iptables -w -D FORWARD --src ' + containerIp + ' --dst ' + host + ' -j ACCEPT' );
    }

    res.end();
} );

var server = app.listen( 3000, '0.0.0.0', function ()
{
    var host = server.address().address;
    var port = server.address().port;

    console.log( 'External Host Controller running at http://%s:%s', host, port );
} );
