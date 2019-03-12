import sqlite from 'sqlite3';




export class DbHelper{

  constructor(){
	this.db = new sqlite.Database(':memory:');
  }

  init= () => {
	this.db.serialize( () => {
	  this.db.run('CREATE TABLE artistsUrls (artist TEXT, url TEXT)');
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


/*
const dbHelper= new DbHelper();
dbHelper.init();

// Insert and check value
dbHelper.addArtistUrl("fake", "hey fake")
.then( () => dbHelper.getArtistUrl("fake")  )
.then( (url) => console.log(`Url retrieved: ${url}`) )
.catch( (err) => console.error(err) ); 

// Unavailable value
dbHelper.getArtistUrl("nonexist") 
.then( (url) => console.log(`Should be nothing: ${url}`) )
.catch( (err) => console.error(err) ); 
*/
