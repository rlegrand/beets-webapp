
export interface AlbumsArtistResponse{
    data: {albumartist:string, addedDate:string}[]
}

export interface AlbumsArtist{
    data: {albumartist:string, addedDate:Date}[]
}

export interface AlbumsResponse{
    data: {album: string}[]

}