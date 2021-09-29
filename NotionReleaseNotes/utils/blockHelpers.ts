import * as not from "@notionhq/client";

export async function heading_1(content: string, url?: string): Promise<any> {
    return {
        object: 'block',
        type: 'heading_1',
        heading_1: {
            text: [
                {
                    type: 'text',
                    text: {
                        content: content,
                        ...(url != undefined ? { link: url } : {})
                    }
                }
            ]
        }
    }
}

export async function heading_2(content: string, url?: string): Promise<any> {
    return {
        object: 'block',
        type: 'heading_2',
        heading_2: {
            text: [
                {
                    type: 'text',
                    text: {
                        content: content,
                        ...(url != undefined ? { link: url } : {})
                    }
                }
            ]
        }
    }
}

export async function heading_3(content: string, url?: string): Promise<any> {
    return {
        object: 'block',
        type: 'heading_3',
        heading_3: {
            text: [
                {
                    type: 'text',
                    text: {
                        content: content,
                        ...(url != undefined ? { link: url } : {})
                    }
                }
            ]
        }
    }
}

export async function bullet_list(content: string[]): Promise<any> {
    return {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
            text: content.map((obj) => { return { text: { content: obj } } })
        }
    }
}


export async function external_image(url: string, caption?: string): Promise<any> {
    return {
        object: 'block',
        type: 'image',
        image: {
            external: {
                url: url
            },
            type: "external",
            caption: caption != undefined ? [ 
                {
                    type: 'text',
                    text: {
                      content: caption,
                    },
                } 
            ] : []
        }
    }
}





