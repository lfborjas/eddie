%{rack pstore uuidtools}.each {|r| require r}
daemon = lambda do |env|
    [200,
        {"Content-Type"=> 'text/plain'},
        ['hola mundo']
    ]
end

Rack::Server.new(:app=>daemon, :Port=>6660).start
