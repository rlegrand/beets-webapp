import {ArtistMetadata} from '../es6/metadata';
import utils from '../es6/utils';
const logger= utils.getLogger();

const artistMetadata= new ArtistMetadata();
artistMetadata.getImage('Buzzthrill', 0, false).subscribe( (res) => logger.info(res) );


