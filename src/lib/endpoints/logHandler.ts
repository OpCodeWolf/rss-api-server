import { Request, Response } from 'express';
import * as databasae from '../database';

export const logHandler = async (req: Request, res: Response): Promise<any> => {

    console.log(req.body);

    res.status(201).json({});
}