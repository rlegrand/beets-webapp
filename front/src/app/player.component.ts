import {Component, ViewChild, ElementRef} from '@angular/core';
import {Song} from './model/songs-response';

@Component({
	selector:'custom-player',
	templateUrl:'player.component.html',
	styleUrls: ['player.component.css'],
	inputs: ['playlist:playlist']
})
export class Player{

	_playlist: Song[]= [];
	songId: number= 0;
	@ViewChild('audioTag') audioTag: ElementRef;

	constructor(){}


	set playlist(pl: Song[]){
		//console.log(pl);
		this._playlist= pl;
	}

	get playlist(){
		return this._playlist;
	}

	isSelected= (id: number) => this.songId ===id ;

	playSong= () => {
		this.audioTag.nativeElement.src= this.getCurrentSong().path;
		this.audioTag.nativeElement.load();
		this.audioTag.nativeElement.play();
	}

	selectSong= (id: number) => {
		this.songId= id;
		this.playSong();
	}

	getCurrentSong= () => this.playlist[this.songId];

	nextSong= () =>{
		this.selectSong(++this.songId % this.playlist.length);
	} 

}