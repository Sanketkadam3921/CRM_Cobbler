const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    let connection;

    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cobbler_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('Connected to database successfully');

        // Read and execute the migration SQL
        const fs = require('fs');
        const path = require('path');
        const sqlFile = path.join(__dirname, 'update_product_types.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Split SQL into individual statements
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.trim().substring(0, 100) + '...');
                await connection.execute(statement.trim());
            }
        }

        console.log('Migration completed successfully!');
        console.log('Product types now include: Bag, Shoe, Wallet, Belt, All type furniture, Jacket, Other');

    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
