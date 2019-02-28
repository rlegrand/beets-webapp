

export interface AlbumArtistRaw{
    name:string,
    addedDate:string
}

export interface AlbumArtist{
    name:string,
    addedDate:Date
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
