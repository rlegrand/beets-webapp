

export interface AlbumArtistRaw{
    name:string,
    addedDate:string,
    url: string
}

export interface AlbumArtist{
    name:string,
    addedDate:Date,
    url: string
}

export interface AlbumArtistsResponse{
    data: AlbumArtistRaw[]
}

export interface Album{
  name: string
}

export interface AlbumsResponse{
  data: Album[]
}
