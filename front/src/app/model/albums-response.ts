

export interface MetadataRaw{
    name:string,
    addedDate:number,
    url: string,
    fields: string[],
    mainField: string
}

export interface Metadata{
    name:string,
    addedDate:Date,
    url: string,
    fields: string[],
    mainField: string
}

export interface MetadataResponse{
    data: MetadataRaw[]
}
