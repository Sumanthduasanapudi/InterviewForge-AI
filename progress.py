import json

from database import (
    get_connection,
    initialize_database,
)


# ==================================================
# OVERALL STATS
# ==================================================

def get_overall_stats():

    connection = get_connection()

    cursor = connection.cursor()


    # Coding attempts
    cursor.execute(
        """
        SELECT
            COUNT(*) AS attempts,
            COUNT(DISTINCT exercise_id) AS exercises_practiced,
            COALESCE(AVG(score), 0) AS average_score,
            COALESCE(SUM(passed), 0) AS passed_attempts
        FROM coding_attempts
        """
    )

    coding = dict(
        cursor.fetchone()
    )


    # Interview attempts
    cursor.execute(
        """
        SELECT
            COUNT(*) AS attempts,
            COALESCE(AVG(total_score), 0) AS average_score,
            COALESCE(AVG(correctness), 0) AS correctness,
            COALESCE(AVG(clarity), 0) AS clarity,
            COALESCE(AVG(depth), 0) AS depth
        FROM interview_attempts
        """
    )

    interview = dict(
        cursor.fetchone()
    )


    # Total practice
    cursor.execute(
        """
        SELECT COUNT(*) AS total
        FROM practice_activity
        """
    )

    total_activity = cursor.fetchone()[
        "total"
    ]


    connection.close()


    coding_attempts = coding[
        "attempts"
    ]


    coding_passed = coding[
        "passed_attempts"
    ]


    coding_pass_rate = 0


    if coding_attempts > 0:

        coding_pass_rate = round(
            (
                coding_passed
                / coding_attempts
            )
            * 100
        )


    return {
        "total_practice_sessions":
            total_activity,

        "coding": {
            "attempts":
                coding_attempts,

            "exercises_practiced":
                coding[
                    "exercises_practiced"
                ],

            "average_score":
                round(
                    coding[
                        "average_score"
                    ],
                    1
                ),

            "passed_attempts":
                coding_passed,

            "pass_rate":
                coding_pass_rate
        },

        "interview": {
            "attempts":
                interview[
                    "attempts"
                ],

            "average_score":
                round(
                    interview[
                        "average_score"
                    ],
                    1
                ),

            "correctness":
                round(
                    interview[
                        "correctness"
                    ],
                    1
                ),

            "clarity":
                round(
                    interview[
                        "clarity"
                    ],
                    1
                ),

            "depth":
                round(
                    interview[
                        "depth"
                    ],
                    1
                )
        }
    }


# ==================================================
# TOPIC PERFORMANCE
# ==================================================

def get_topic_performance():

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute(
        """
        SELECT
            topic,
            activity_type,
            COUNT(*) AS attempts,
            AVG(score) AS average_score
        FROM practice_activity
        GROUP BY
            topic,
            activity_type
        ORDER BY
            average_score ASC
        """
    )


    rows = cursor.fetchall()

    connection.close()


    results = []


    for row in rows:

        results.append(
            {
                "topic":
                    row[
                        "topic"
                    ],

                "type":
                    row[
                        "activity_type"
                    ],

                "attempts":
                    row[
                        "attempts"
                    ],

                "average_score":
                    round(
                        row[
                            "average_score"
                        ],
                        1
                    )
            }
        )


    return results


# ==================================================
# WEAK AREAS
# ==================================================

def get_weak_areas():

    performance = (
        get_topic_performance()
    )


    weak = [
        item
        for item in performance
        if item[
            "average_score"
        ] < 70
    ]


    weak.sort(
        key=lambda item:
        item[
            "average_score"
        ]
    )


    return weak[:5]


# ==================================================
# STRONG AREAS
# ==================================================

def get_strong_areas():

    performance = (
        get_topic_performance()
    )


    strong = [
        item
        for item in performance
        if item[
            "average_score"
        ] >= 70
    ]


    strong.sort(
        key=lambda item:
        item[
            "average_score"
        ],
        reverse=True
    )


    return strong[:5]


# ==================================================
# RECENT ACTIVITY
# ==================================================

def get_recent_activity(
    limit=10
):

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute(
        """
        SELECT
            activity_type,
            topic,
            score,
            created_at
        FROM practice_activity
        ORDER BY id DESC
        LIMIT ?
        """,
        (
            limit,
        )
    )


    rows = cursor.fetchall()

    connection.close()


    return [
        {
            "type":
                row[
                    "activity_type"
                ],

            "topic":
                row[
                    "topic"
                ],

            "score":
                row[
                    "score"
                ],

            "created_at":
                row[
                    "created_at"
                ]
        }

        for row in rows
    ]


# ==================================================
# DAILY PROGRESS
# ==================================================

def get_daily_progress():

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute(
        """
        SELECT
            DATE(created_at) AS practice_date,
            COUNT(*) AS sessions,
            AVG(score) AS average_score
        FROM practice_activity
        GROUP BY DATE(created_at)
        ORDER BY practice_date ASC
        LIMIT 30
        """
    )


    rows = cursor.fetchall()

    connection.close()


    return [
        {
            "date":
                row[
                    "practice_date"
                ],

            "sessions":
                row[
                    "sessions"
                ],

            "average_score":
                round(
                    row[
                        "average_score"
                    ],
                    1
                )
        }

        for row in rows
    ]


# ==================================================
# CODING HISTORY
# ==================================================

def get_coding_history(
    limit=10
):

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute(
        """
        SELECT
            exercise_id,
            topic,
            difficulty,
            passed,
            score,
            created_at
        FROM coding_attempts
        ORDER BY id DESC
        LIMIT ?
        """,
        (
            limit,
        )
    )


    rows = cursor.fetchall()

    connection.close()


    return [
        {
            "exercise_id":
                row[
                    "exercise_id"
                ],

            "topic":
                row[
                    "topic"
                ],

            "difficulty":
                row[
                    "difficulty"
                ],

            "passed":
                bool(
                    row[
                        "passed"
                    ]
                ),

            "score":
                row[
                    "score"
                ],

            "created_at":
                row[
                    "created_at"
                ]
        }

        for row in rows
    ]


# ==================================================
# INTERVIEW HISTORY
# ==================================================

def get_interview_history(
    limit=10
):

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute(
        """
        SELECT
            topic,
            difficulty,
            question,
            correctness,
            clarity,
            depth,
            total_score,
            created_at
        FROM interview_attempts
        ORDER BY id DESC
        LIMIT ?
        """,
        (
            limit,
        )
    )


    rows = cursor.fetchall()

    connection.close()


    return [
        {
            "topic":
                row[
                    "topic"
                ],

            "difficulty":
                row[
                    "difficulty"
                ],

            "question":
                row[
                    "question"
                ],

            "correctness":
                row[
                    "correctness"
                ],

            "clarity":
                row[
                    "clarity"
                ],

            "depth":
                row[
                    "depth"
                ],

            "score":
                row[
                    "total_score"
                ],

            "created_at":
                row[
                    "created_at"
                ]
        }

        for row in rows
    ]


# ==================================================
# COMPLETE DASHBOARD
# ==================================================

def get_dashboard():

    return {
        "overview":
            get_overall_stats(),

        "topic_performance":
            get_topic_performance(),

        "weak_areas":
            get_weak_areas(),

        "strong_areas":
            get_strong_areas(),

        "daily_progress":
            get_daily_progress(),

        "recent_activity":
            get_recent_activity(),

        "coding_history":
            get_coding_history(),

        "interview_history":
            get_interview_history()
    }


# ==================================================
# LOCAL TEST
# ==================================================

if __name__ == "__main__":

    initialize_database()


    dashboard = (
        get_dashboard()
    )


    print(
        json.dumps(
            dashboard,
            indent=2
        )
    )