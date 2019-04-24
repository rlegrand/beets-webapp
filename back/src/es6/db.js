import sqlite from 'sqlite3';




class DbHelper{

  constructor(){
	this.db = new sqlite.Database('/app/data/bw.db');
  }

  init= () => {
	this.db.serialize( () => {
	  this.db.run('CREATE TABLE IF NOT EXISTS artistsUrls (artist TEXT, url TEXT)');
	} );
  }

  addArtistUrl= (artistName, artistUrl) => 
	new Promise(  (resolve, reject) => 
	  this.db.run('INSERT INTO artistsUrls values (?,?)', [artistName, artistUrl],
        (err) => {
          if (err) reject(err);
          else resolve();
        })
    )
 

  getArtistUrl= (artistName) => 
	new Promise(  (resolve, reject) => 
	  this.db.get(
		'SELECT * from artistsUrls where artist = ?', [artistName],
	  	(err, row) => {
          if (err) reject(err);
          if (row) resolve(row.url);
          else resolve();
         })
	)

}

const dbHelper= new DbHelper();
dbHelper.init();

export default dbHelper;
