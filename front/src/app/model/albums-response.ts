

export interface ArtistRaw{
    name:string,
    addedDate:number,
    url: string,
    fields: string[],
    mainField: string
}

export interface Artist{
    name:string,
    addedDate:Date,
    url: string,
    fields: string[],
    mainField: string
}

export interface ArtistsResponse{
    data: ArtistRaw[]
}

export interface Album{
  name: string
}

export interface AlbumsResponse{
  data: Album[]
}
