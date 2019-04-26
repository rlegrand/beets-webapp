

export interface AlbumArtistRaw{
    name:string,
    addedDate:string,
    url: string,
    field: string
}

export interface AlbumArtist{
    name:string,
    addedDate:Date,
    url: string,
    field: string
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
