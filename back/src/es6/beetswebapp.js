import minimist from 'minimist';
import { ArtistMetadata } from './metadata';
import { StandaloneServer} from './server';

const args= minimist(process.argv.slice(2));

const usage="node beetswebapp [server] [genmetadata]";


if ( args._.length > 1 || ['server','genmetadata'].filter( (action) => args._[0] == action ).length == 0 ){
  console.error(usage);
  process.exit(-1);
}

const action= args._[0]

switch (action){
  case 'server':
    const server=new StandaloneServer();
    server.run(80);
    break;
  case 'genmetadata':
    const artistmeta= new ArtistMetadata();
    artistmeta.store().subscribe( () => console.log(`metadata generation complete`  )  );
    break;
}


