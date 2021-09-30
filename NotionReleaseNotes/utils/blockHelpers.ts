export async function heading_1(content: string, url?: string): Promise<any[]> {
    const obj = {
        object: 'block',
        type: 'heading_1',
        heading_1: {
            text: [
                {
                    type: 'text',
                    text: {
                        ...{ content: content },
                        ...(url != undefined ? { link: { url: url } } : {})
                    }
                }
            ]
        }
    }

    console.log(`Sucesfully added object: ${obj.type}`);

    return [obj];
}

export async function heading_2(content: string, url?: string): Promise<any[]> {
    var obj = {
        object: 'block',
        type: 'heading_2',
        heading_2: {
            text: [
                {
                    type: 'text',
                    text: {
                        ...{ content: content },
                        ...(url != undefined ? { link: { url: url } } : {})
                    },
                },
            ]
        }
    }

    console.log(`Sucesfully added object: ${obj.type}`);

    return [obj];
}

export async function heading_3(content: string, url?: string): Promise<any[]> {
    var obj = {
        object: 'block',
        type: 'heading_3',
        heading_3: {
            text: [
                {
                    type: 'text',
                    text: {
                        ...{ content: content },
                        ...(url != undefined ? { link: { url: url } } : {})
                    }
                }
            ]
        }
    }

    console.log(`Sucesfully added object: ${obj.type}`);

    return [obj];
}

export async function bullet_list(content: string[]): Promise<any[]> {
    var obj: any[] = content.map(function (c) {
        return {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
                text: [
                    {
                        text: {
                            content: c,
                        }
                    }
                ]
            }
        }
    });

    return obj;
}

export async function external_image(url: string, caption?: string): Promise<any[]> {
    var obj = {
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

    console.log(`Sucesfully added object: ${obj.type}`);

    return [obj];
}

export async function paragraph(content: string): Promise<any[]> {
    var obj = {
        object: 'block',
        type: 'paragraph',
        paragraph: {
            text: [
                {
                    text: {
                        content: content
                    }
                }
            ]
        }
    }

return [obj];
}