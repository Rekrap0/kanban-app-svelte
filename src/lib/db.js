import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper function to run queries
/**
 * @param {string | pg.QueryArrayConfig<any>} text
 * @param {any[] | undefined} [params]
 */
export async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Database operations for boards
export const boardsDb = {
  /**
     * @param {string} name
     */
  async create(name) {
    const result = await query(
      'INSERT INTO boards (name) VALUES ($1) RETURNING *',
      [name]
    );
    return result.rows[0];
  },

  async getAll() {
    const result = await query('SELECT * FROM boards ORDER BY created_at DESC');
    return result.rows;
  },

  /**
   * @param {string} id
   */
  async getById(id) {
    const result = await query('SELECT * FROM boards WHERE id = $1', [id]);
    return result.rows[0];
  },

  /**
   * @param {string} id
   * @param {string} name
   */
  async update(id, name) {
    const result = await query(
      'UPDATE boards SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0];
  },

  /**
   * @param {string} id
   */
  async delete(id) {
    await query('DELETE FROM boards WHERE id = $1', [id]);
  }
};

// Database operations for cards
export const cardsDb = {
  async create(boardId, columnId, data) {
    const result = await query(
      `INSERT INTO cards (
        board_id, column_id, title, description, position, due_date
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [boardId, columnId, data.title, data.description, data.position, data.dueDate]
    );
    return result.rows[0];
  },


  async update(id, data) {
    const result = await query(
      `UPDATE cards 
       SET title = $1, description = $2, position = $3, 
           due_date = $4, column_id = $5
       WHERE id = $6 RETURNING *`,
      [data.title, data.description, data.position, data.dueDate, data.columnId, id]
    );
    return result.rows[0];
  },

  async addVersion(cardId, changes, userId) {
    await query(
      'INSERT INTO card_versions (card_id, changes, changed_by) VALUES ($1, $2, $3)',
      [cardId, changes, userId]
    );
  },

  async getVersions(cardId) {
    const result = await query(
      'SELECT * FROM card_versions WHERE card_id = $1 ORDER BY created_at DESC',
      [cardId]
    );
    return result.rows;
  }
};

// Database operations for columns
export const columnsDb = {
  async create(boardId, name, position) {
    const result = await query(
      'INSERT INTO columns (board_id, name, position) VALUES ($1, $2, $3) RETURNING *',
      [boardId, name, position]
    );
    return result.rows[0];
  },

  async updatePositions(updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const update of updates) {
        await client.query(
          'UPDATE columns SET position = $1 WHERE id = $2',
          [update.position, update.id]
        );
      }
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};