import redis from 'redis';
import utils from './utils';
const logger= utils.getLogger();


export default class DbHelper{

  constructor(){ }

  init() {
    this.client= redis.createClient({host:'redis'});
    this.client.on( 'error', (e) => logger.error(e) );
    return this;
  }

  addUri= (hname, uri) =>
    new Promise((resolve, reject) =>
      this.client.hset(hname, 'url', uri, (err, res) => {
        if (err) reject(err);
        resolve(res);
      }))

  addArtistUrl= (artistName, artistUrl) => this.addUri(`artist:${artistName}`, artistUrl)
   
  addAlbumUrl= (albumName, albumUrl) => this.addUri(`album:${albumName}`, albumUrl)

  getUri= (hname) => 
    new Promise((resolve, reject) => {
      this.client.hget(hname, 'url', (err, res) => {
        logger.debug(`${hname} url ? : ${res}`);
        if (err) reject(err);
        resolve(res);
      }) 
    })


  getArtistUrl = (artistName) => this.getUri(`artist:${artistName}`)
  
  getAlbumUrl = (albumName) => this.getUri(`album:${albumName}`)

  static get(){
    return new DbHelper().init();
  }

}

