import sqlite3
from pathlib import Path


# ==================================================
# DATABASE CONFIGURATION
# ==================================================

DATABASE_FOLDER = Path("data")
DATABASE_FOLDER.mkdir(exist_ok=True)

DATABASE_PATH = DATABASE_FOLDER / "interviewforge.db"


# ==================================================
# DATABASE CONNECTION
# ==================================================

def get_connection():

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = sqlite3.Row

    return connection


# ==================================================
# CREATE TABLES
# ==================================================

def initialize_database():

    connection = get_connection()

    cursor = connection.cursor()


    # ----------------------------------------------
    # Coding Gym attempts
    # ----------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS coding_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            exercise_id TEXT NOT NULL,

            topic TEXT NOT NULL,

            difficulty TEXT NOT NULL,

            code TEXT NOT NULL,

            passed INTEGER NOT NULL,

            score INTEGER NOT NULL,

            feedback TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


    # ----------------------------------------------
    # Interview sessions
    # ----------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS interview_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            topic TEXT NOT NULL,

            difficulty TEXT NOT NULL,

            question TEXT NOT NULL,

            answer TEXT NOT NULL,

            correctness INTEGER NOT NULL,

            clarity INTEGER NOT NULL,

            depth INTEGER NOT NULL,

            total_score INTEGER NOT NULL,

            feedback TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


    # ----------------------------------------------
    # Practice activity
    # ----------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS practice_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            activity_type TEXT NOT NULL,

            topic TEXT NOT NULL,

            score INTEGER,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


    connection.commit()

    connection.close()


# ==================================================
# TEST
# ==================================================

if __name__ == "__main__":

    initialize_database()

    print(
        "InterviewForge database created successfully."
    )

    print(
        f"Database location: {DATABASE_PATH}"
    )