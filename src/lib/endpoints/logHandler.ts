import { Request, Response } from 'express';
import * as databasae from '../database';

export const logHandler = async (req: Request, res: Response): Promise<any> => {

    // TODO: Add the ability to view the server logs in the Frontend UI via an API request
    console.log(req.body);

    res.status(201).json({});
}