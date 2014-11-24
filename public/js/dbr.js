define(['underscore', 'jquery'], function(_, $){
    /*jshint unused:false */

    var buffer = [];
    var repl_endpoint = '/repl'

    function _log_print(objects){
        var rep = objects.join(' ');
        buffer.push(rep)
    }


    function _flush_buffer(){
        if(! buffer.length) return;
        var out = buffer;
        buffer = [];

        $.ajax({type:'POST', url:repl_endpoint, data:{output:out}, dataType:'json'})
    }
    function log(){
        _log_print(_.toArray(arguments));
    }
    var installed = false;
    function install(){
        if (installed) return;
        installed = true;
        setInterval(function(){
            _flush_buffer();
        }, 1000);
        window.$log = log;
        window.$error = function(){
            log.apply(null, ['Error: '].concat(_.toArray(arguments)));
        }
        $log('debug output installed')
    }

    return { install:install };
});
