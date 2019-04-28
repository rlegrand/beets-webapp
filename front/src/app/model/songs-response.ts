
export interface Song{
	path: string,
	artist: string,
	album: string,
	title: string
}

export interface SongsResponse{
	songs: Song[]
}