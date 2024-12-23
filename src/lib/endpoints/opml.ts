import { Request, Response } from 'express';
import xml2js from 'xml2js';

export const getOpmlHandler = async (req: Request, res: Response) => {
    try {
        const opml = {
            opml: {
                $: { version: '1.0' },
                body: {
                    outline: {
                        $: {
                            text: process.env.OPML_TITLE || 'RSS Feed', // Use the OPML_TITLE from the environment variable or a default
                            type: 'rss',
                            xmlUrl: `${process.env.SERVER_URL}/rss`
                        }
                    }
                }
            }
        };

        const builder = new xml2js.Builder();
        const xml = builder.buildObject(opml);
        res.header('Content-Type', 'text/xml');
        res.attachment('opml.xml').send(xml);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate OPML file' });
    }
};
