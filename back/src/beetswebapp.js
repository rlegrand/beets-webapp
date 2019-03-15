import minimist from 'minimist';
import { ArtistMetadata } from './metadata';
import { StandaloneServer} from './server';

const args= minimist(process.argv.slice(2));

const usage="node beetswebapp [server] [genmetadata]";


if ( args._.length > 1 || ['server','genmetadata'].filter( (action) => args._[0] == action ).length == 0 ){
  console.error(usage);
  exit(-1);
}

const action= args._[0]


switch (action){
  case 'server':
    new StandaloneServer().run(80);
    break;
  case 'genmetadata':
    new ArtistMetadata().store();
    break;
}


