import { Request, Response } from 'express';
import { getUserByUsername, deleteUserByUsername } from '../database'; // Importing the necessary functions

export const deleteUserHandler = async (req: Request, res: Response) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await deleteUserByUsername(username); // Call the existing function to delete the user
    return res.status(200).send({
      "message": "User deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};
