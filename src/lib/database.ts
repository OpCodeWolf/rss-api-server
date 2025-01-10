import sqlite3 from 'sqlite3';
import axios from 'axios';
import xml2js from 'xml2js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserLevel } from '../types/UserLevel';
import { User } from '../types/User';

const db = new sqlite3.Database('rss.db');

// TODO: Setup a migration tool with sql files for all database changes

// Migration function to ensure the 'deleted' column exists in the rss_items table
const migrateDatabase = (): void => {
  db.serialize(() => {
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='rss_items'`, (err: Error | null, row: { name: string } | undefined) => {
      if (err) {
        console.error(`Error checking if rss_items table exists: ${err}`);
        return; // Exit if the table does not exist
      }
      if (!row) {
        // Create the rss_items table if it does not exist
        db.run(`CREATE TABLE rss_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          link TEXT UNIQUE NOT NULL,
          title TEXT,
          description TEXT,
          pubDate TEXT,
          dateTime TEXT,
          image TEXT,
          deleted INTEGER NOT NULL DEFAULT 0
        )`, (err) => {
          if (err) {
            console.error(`Error creating rss_items table: ${err}`);
          } else {
            console.log(`rss_items table created.`);
          }
        });
        return;
      }
      db.get(`PRAGMA table_info(rss_items)`, (err: Error | null, columns: Array<{ name: string }>) => {
        if (err) {
          console.error(`Error checking columns: ${err}`);
          return;
        }
        console.log(JSON.stringify(columns));
        if (Array.isArray(columns)) {
          const hasDeletedColumn = columns.some(column => column.name === 'deleted');
          if (!hasDeletedColumn) {
            db.run(`ALTER TABLE rss_items ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0`, (err) => {
              if (err) {
                console.error(`Error adding 'deleted' column: ${err}`);
              } else {
                console.log(`'deleted' column added to rss_items table.`);
              }
            });
          }
        } else {
          console.error(`Columns information is undefined.`);
        }
      });
    });
  });
}

// Call the migration function on startup
migrateDatabase();

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS filter_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filter TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    dateTime TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS rss_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    pubDate TEXT,
    dateTime TEXT,
    image TEXT,
    deleted INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS rss_streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT
  )`);

  // Table for user accounts
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    token TEXT UNIQUE,
    user_level TEXT NOT NULL DEFAULT 'public'
  )`);

  // INSERT the default admin account
  db.run(
    `INSERT INTO users (username, password, token, user_level)
      VALUES ('admin', '498fd89b34abaae5f6694f889d84ac86$7b504d7f883be55b1c41549707b99aac2a5d8ff81adfe30cad1f1cf89ca84278967c48cce477313b56e7795f6ef72e1ad52f9db9a1c03a52f57a1edf1cd16010', '12345-12345-12345-12345', 'superadmin')`,
    (err) => {
      if (err && err.message.includes('SQLITE_CONSTRAINT')) {
        // Intentionally left blank
      } else if (err) {
        console.log(`Database error: ${err}`);
      } else {
        console.log(`Super admin user added to the database. (Username: admin, Password: admin123, Token: 12345-12345-12345-12345) Please change the temporary password and token after logging in.`);
      }
    }
  );
});

// TODO: Move to types directory
interface RssFeed {
  rss: {
    channel: Array<{
      title: string[];
      description: string[];
      item: Array<{
        title: string[];
        link: string[];
        description: string[];
        pubDate: string[];
        date: string[];
      }>;
    }>;
  };
}

// TODO: Move to types directory
interface RSSItemRow {
  id: number;
  link: string;
  title: string;
  description: string;
  pubDate: string;
  dateTime: string;
  image: string;
  deleted: boolean;
}

// TODO: Add method level documentation to be used in an external documentation tool

// Get all users with pagination
export const getAllUsers = (page: number = 1, pageSize: number = 10): Promise<{ id: number; username: string; user_level: string }[]> => {
  const offset = (page - 1) * pageSize;
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, username, user_level, token FROM users LIMIT ? OFFSET ?`, [pageSize, offset], (err: Error | null, rows: { id: number; username: string; user_level: string }[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const addRssStream = (link: string): Promise<number|any> => {
  return new Promise((resolve, reject) => {
    axios.get(link)
      .then((response) => {
        const parser = new xml2js.Parser();
        parser.parseString(String(response.data), (err: Error | null, result: RssFeed | null) => {
          if (err) {
            return reject(err);
          }

          const titleArray = result?.rss.channel[0].title;
          const descriptionArray = result?.rss.channel[0].description;
          const title = Array.isArray(titleArray) && titleArray.length > 0 ? titleArray[0] : null;
          const description = Array.isArray(descriptionArray) && descriptionArray.length > 0 ? descriptionArray[0] : null;

          if (typeof title === 'string' && typeof description === 'string') {
            db.run(`INSERT INTO rss_streams (link, title, description) VALUES (?, ?, ?)`, [link, title, description], function (err: Error | null) {
              if (err) {
                reject(err);
              } else {
                resolve(this.lastID);
              }
            });
          } else {
            reject(new Error('Title or description is not a string'));
          }
        });
      })
      .catch(err => reject(err));
  });
};

export const rssItemLinkExists = (link: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!link) {
      console.error('Invalid input: "link" is required');
      return resolve(false);
    }

    db.all(
      `SELECT * FROM rss_items WHERE (link) = (?)`, 
      link, 
      function (err: Error | null, rows: any) {
        if (err) {
          console.error(`DB Error: ${err.message}`);
          return reject(err);
        }

        if (rows.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    );
  });
};

export const getRssItem = (link: string): Promise<{link: string; title: string; description: string; pubDate: string; dateTime: string; image: string}> => {
  return new Promise((resolve, reject) => {
    db.get (`SELECT link, title, description, pubDate, dateTime, image FROM rss_items WHERE link = ?`, [link], (err: Error | null, row: { 
      link: string; title: string; description: string; pubDate: string; dateTime: string; image: string
    }) => {
      if (err) {
        console.log(`DB Error: ${err}`);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

export const insertRssItem = (item: { link: string; title: string; description: string; pubDate: string; dateTime: string; image: string }): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO rss_items (link, title, description, pubDate, dateTime, image, deleted) VALUES (?, ?, ?, ?, ?, ?, ?)`, [item.link, item.title, item.description, item.pubDate, item.dateTime, item.image, 0], function (err: Error | null) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          resolve(false); // Ignore duplicates
        } else {
          console.log(`ERR: ${err}`);
          reject(err);
        }
      } else {
        console.log(`Added item to DB: ${item.link}`);
        resolve(true);
      }
    });

  });
};

export const updateItemImage = (link: string, imageUrl: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!link) {
      return reject(new Error('Error: Image link is not set, nothing to update'));
    }
    console.log(`Adding image link: ${imageUrl} to item ${link}`);
    
    try {
      db.run(
        `UPDATE rss_items SET image = ? WHERE link = ?`,
        [imageUrl, link],
        function (err: Error | null) {
          if (err) {
            return reject(err); // Reject the promise if there's an error
          }
          if (this.changes === 0) {
            // No rows were updated
            return reject(new Error('No item found with the specified link to update.'));
          }
          resolve(true); // Successfully updated
        }
      );
    } catch (error) {
      reject(error); // Reject with the caught error
    }
  });
};

// Update an RSS item
export const updateRssItemInDatabase = (id: number, item: { title?: string; description?: string; link?: string; pubDate?: string; image?: string, deleted?: number }): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    if (item.title) {
      fields.push('title = ?');
      values.push(item.title);
    }
    if (item.description) {
      fields.push('description = ?');
      values.push(item.description);
    }
    if (item.link) {
      fields.push('link = ?');
      values.push(item.link);
    }
    if (item.pubDate) {
      fields.push('pubDate = ?');
      values.push(item.pubDate);
    }
    if (item.image) {
      fields.push('image = ?');
      values.push(item.image);
    } else {
      fields.push('image = ?');
      values.push('');
    }

    if (item.deleted) {
      fields.push('deleted = ?');
      values.push(item.deleted);
    }

    if (fields.length === 0) {
      return reject(new Error('No fields to update'));
    }

    values.push(id); // Add the ID to the end of the values array

    db.run(`UPDATE rss_items SET ${fields.join(', ')} WHERE id = ?`, values, function (err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const getAllRssStreams = (): Promise<{ id: number; link: string; title: string; description: string }[]> => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, link, title, description FROM rss_streams`, [], (err: Error | null, rows: { id: number; link: string; title: string; description: string }[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const getAllRssItems = (pubDateOrder: 'asc' | 'desc' = 'asc', page: number = 1, pageSize: number = 20): Promise<{ id: number; link: string; title: string; description: string; pubDate: string; dateTime: string, image: string, deleted: number }[]> => {
  const offset = (page - 1) * pageSize;
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, link, title, description, pubDate, dateTime, image, deleted FROM rss_items WHERE deleted = 0 ORDER BY dateTime ${pubDateOrder} LIMIT ? OFFSET ?`, [pageSize, offset], (err: Error | null, rows: { id: number; link: string; title: string; description: string; pubDate: string; dateTime: string; image: string, deleted: number }[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const getTotalRssItemsCount = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) AS count FROM rss_items WHERE deleted = 0`, [], (err: Error | null, row: { count: number }) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
};

export const deleteRssItemById = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE rss_items SET deleted = 1 WHERE id = ?`, [id], function (err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const deleteRssStreamById = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM rss_streams WHERE id = ?`, [id], function (err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Delete old RSS items
export const deleteOldRssItems = (date: Date): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM rss_items WHERE dateTime < ?`, [date.toISOString()], function (err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Get user by username
export const getUserByUsername = (username: string): Promise<{ id: number; username: string; password: string; token: string, user_level: string } | null> => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err: Error | null, row: { id: number; username: string; password: string; token: string, user_level: string } | undefined) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
};

// Create a user
export const createUser = async (username: string, password: string, user_level: UserLevel): Promise<User> => {
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a random token for the user
  const token = uuidv4();
  await updateUserToken(username, token);
          
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO users (username, password, user_level) VALUES (?, ?, ?)`, [username, hashedPassword, user_level.toString()], function (err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve({
          username: username,
          password: hashedPassword,
          token: token
        });
      }
    });
  });
};

export const deleteUserByUsername = (username: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM users WHERE username = ?`, [username], function (err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};


// Update user level
export const updateUserLevel = (username: string, newUserLevel: UserLevel): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET user_level = ? WHERE username = ?`, [newUserLevel.toString(), username], function (err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Update a user password
export const updateUserPassword = (username: string, newPassword: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET password = ? WHERE username = ?`, [newPassword, username], function (err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Update a user password
export const updateUserToken = (username: string, newToken: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET token = ? WHERE username = ?`, [newToken, username], function (err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Generate a valid token
export const generateValidToken = (): string => {
  return '' + Math.random().toString(36).substr(2); // Simple token generation
};

// Save the token
export const saveToken = (username: string, token: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET token = ? WHERE username = ?`, [token, username], function (err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Get user by token
export const getUserByToken = (token: string): Promise<{ id: number; username: string; password: string; token: string, user_level: UserLevel } | null> => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE token = ?`, [token], (err: Error | null, row: { id: number; username: string; password: string; token: string, user_level: UserLevel } | undefined) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
};


/****************
 * FILTER ITEMS
 ****************/

export const getAllFilterItems = (page: number = 1, pageSize: number = 20): Promise<{ id: number; filter: string; title: string; description: string, dateTime: string}[]> => {
  const offset = (page - 1) * pageSize;
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, filter, title, description, dateTime FROM filter_items ORDER BY dateTime asc LIMIT ? OFFSET ?`, [pageSize, offset], (err: Error | null, rows: { id: number; filter: string; title: string; description: string; dateTime: string }[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Add a new filter item
export const addFilterItem = (item: { filter: string, title?: string; description?: string}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    if (item.filter) {
      fields.push('filter');
      values.push(item.filter);
    }
    if (item.title) {
      fields.push('title');
      values.push(item.title);
    }
    if (item.description) {
      fields.push('description');
      values.push(item.description);
    }

    if (fields.length === 0) {
      return reject(new Error('No fields to update'));
    }

    fields.push('dateTime');
    values.push(formatDate(new Date().toISOString()));

    let valuePlaceholders = [];
    for (let key in values) {
      valuePlaceholders.push('?');
    }

    db.run(`INSERT INTO filter_items (${fields.join(', ')}) VALUES (${valuePlaceholders.join(', ')})`, values, function (err: Error | null) {
      if (err) {
        console.log(`DB Error: ${err}`);
        reject(err);
      } else {
        console.log(`Resolved`);
        resolve();
      }
    });
  });
};

export const getTotalFilterItemsCount = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) AS count FROM filter_items`, [], (err: Error | null, row: { count: number }) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
};

export const deleteFilterItemById = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM filter_items WHERE id = ?`, [id], function (err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Update or add a filter item
export const updateOrAddFilterItemInDatabase = (item: { filter: string, id?: number, title?: string; description?: string}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    if (item.id) {

      if (item.filter) {
        fields.push('filter = ?');
        values.push(item.filter);
      }

      if (item.title) {
        fields.push('title = ?');
        values.push(item.title);
      }

      if (item.description) {
        fields.push('description = ?');
        values.push(item.description);
      }

      if (fields.length === 0) {
        return reject(new Error('No fields to update'));
      }

      values.push(item.id); // Add the ID to the end of the values array

      db.run(`UPDATE filter_items SET ${fields.join(', ')} WHERE id = ?`, values, function (err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      addFilterItem({
        filter: item.filter,
        title: item.title,
        description: item.description
      }).then(() => {
        resolve();
      });
    }
  });
};

// TODO: Move to a Utils class (duplicate)
export const formatDate = (isoDateString: string): string => {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}