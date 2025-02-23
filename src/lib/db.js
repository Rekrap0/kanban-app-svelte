import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
export async function initializeDB() {
    const db = await open({
        filename: path.join(__dirname, '../../data/kanban.db'),
        driver: sqlite3.Database
    });

    // Create tables if they don't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS boards (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            columns TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            board TEXT NOT NULL,
            column TEXT NOT NULL,
            tags TEXT,
            dueDate TEXT,
            description TEXT,
            FOREIGN KEY (board) REFERENCES boards(id)
        );

        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cardId TEXT NOT NULL,
            author TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (cardId) REFERENCES cards(id)
        );

        CREATE TABLE IF NOT EXISTS versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cardId TEXT NOT NULL,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (cardId) REFERENCES cards(id)
        );
    `);

    return db;
}

// Database operations
export class KanbanDB {
    /**
   * @param {import("sqlite").Database<sqlite3.Database, sqlite3.Statement>} db
   */
    constructor(db) {
        this.db = db;
    }

    // Board operations
    async getBoards() {
        const boards = await this.db.all('SELECT * FROM boards');
        return boards.map(board => ({
            ...board,
            columns: JSON.parse(board.columns)
        }));
    }

    /**
   * @param {string} id
   */
    async getBoard(id) {
        const board = await this.db.get('SELECT * FROM boards WHERE id = ?', id);
        return board ? {
            ...board,
            columns: JSON.parse(board.columns)
        } : null;
    }

    /**
   * @param {{ id: any; name: any; columns: any; }} board
   */
    async createBoard(board) {
        await this.db.run(
            'INSERT INTO boards (id, name, columns) VALUES (?, ?, ?)',
            board.id,
            board.name,
            JSON.stringify(board.columns)
        );
    }

    // Card operations
    async getCards(boardId = null) {
        const query = boardId 
            ? 'SELECT c.*, GROUP_CONCAT(com.author || "|" || com.text || "|" || com.timestamp) as comments FROM cards c LEFT JOIN comments com ON c.id = com.cardId WHERE c.board = ? GROUP BY c.id'
            : 'SELECT c.*, GROUP_CONCAT(com.author || "|" || com.text || "|" || com.timestamp) as comments FROM cards c LEFT JOIN comments com ON c.id = com.cardId GROUP BY c.id';
        
        const params = boardId ? [boardId] : [];
        const cards = await this.db.all(query, ...params);
        
        return cards.map(card => ({
            ...card,
            tags: JSON.parse(card.tags || '[]'),
            comments: this._parseComments(card.comments),
            versions: [] // Versions will be loaded separately when needed
        }));
    }

    /**
   * @param {{ id: any; title: any; board: any; column: any; tags: any; dueDate: any; description: any; }} card
   */
    async createCard(card) {
        await this.db.run(
            'INSERT INTO cards (id, title, board, column, tags, dueDate, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            card.id,
            card.title,
            card.board,
            card.column,
            JSON.stringify(card.tags),
            card.dueDate,
            card.description
        );
    }

    /**
   * @param {{ title: any; board: any; column: any; tags: any; dueDate: any; description: any; id: any; }} card
   */
    async updateCard(card) {
        await this.db.run(
            'UPDATE cards SET title = ?, board = ?, column = ?, tags = ?, dueDate = ?, description = ? WHERE id = ?',
            card.title,
            card.board,
            card.column,
            JSON.stringify(card.tags),
            card.dueDate,
            card.description,
            card.id
        );
    }

    /**
   * @param {any} cardId
   */
    async deleteCard(cardId) {
        await this.db.run('DELETE FROM cards WHERE id = ?', cardId);
    }

    // Helper methods
    /**
   * @param {string} commentsString
   */
    _parseComments(commentsString) {
        if (!commentsString) return [];
        return commentsString.split(',').map(comment => {
            const [author, text, timestamp] = comment.split('|');
            return { author, text, timestamp };
        });
    }
}

// Create a singleton instance
/**
 * @type {KanbanDB | null}
 */
let dbInstance = null;

export async function getDatabase() {
    if (!dbInstance) {
        const db = await initializeDB();
        dbInstance = new KanbanDB(db);
    }
    return dbInstance;
}