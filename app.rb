require 'rack'
daemon = lambda do |env|
    [200,
        {"Content-Type"=> 'text/plain'},
        ['hola mundo']
    ]
end

Rack::Handler::WEBrick.run(daemon, :Port=>6660 )
