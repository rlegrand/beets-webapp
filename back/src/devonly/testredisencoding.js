import redis from 'redis';

    const client= redis.createClient({host:'redis'});
    client.on( 'error', (e) => console.error(e) );

    client.hset("artist:Hélène Ségara feat. Laura Pausini", 'url', "ok", (err,res) => {
        if (err){
            console.error(err);
            throw err;
        } 
        console.info("Key set");
        client.hget('artist:Hélène Ségara feat. Laura Pausini', 'url', (err, res) => {
            if (err || !res){
                console.error(`Key not found`);
                throw err;
            }
            console.info(`Url ofund: ${res}`);
        })

    } )



