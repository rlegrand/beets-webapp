import minimist from 'minimist';
import { ArtistMetadata, AlbumMetadata } from './metadata';
import { StandaloneServer} from './server';
import utils from './utils';
const logger= utils.getLogger();

const args= minimist(process.argv.slice(2));

const usage="node beetswebapp [server] [genmetadata]";


if ( args._.length > 1 || ['server','genmetadata'].filter( (action) => args._[0] == action ).length == 0 ){
  logger.error(usage);
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
    const albummeta= new AlbumMetadata();
    artistmeta.store( 1000, 1 ).toPromise()
    .then( () => albummeta.store( 1000, 1 ).toPromise() )
    .then( () => logger.info(`Generation complete`));
    break;
}
