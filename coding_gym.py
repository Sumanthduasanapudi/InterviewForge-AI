import json
import subprocess
import sys
import tempfile
from pathlib import Path

from database import (
    get_connection,
    initialize_database,
)


# ==================================================
# CODING EXERCISES
# ==================================================

EXERCISES = {

    "python_001": {
        "id": "python_001",
        "title": "Sum a List",
        "topic": "Python Lists",
        "difficulty": "Beginner",

        "description": (
            "Create a function called sum_numbers(numbers) "
            "that returns the sum of all numbers in a list."
        ),

        "function_name": "sum_numbers",

        "starter_code": """def sum_numbers(numbers):
    # Write your code here
    pass
""",

        "tests": [
            {
                "args": [[1, 2, 3]],
                "expected": 6
            },
            {
                "args": [[10, 20, 30]],
                "expected": 60
            },
            {
                "args": [[]],
                "expected": 0
            },
            {
                "args": [[-5, 5, 10]],
                "expected": 10
            }
        ]
    },


    "python_002": {
        "id": "python_002",
        "title": "Count Even Numbers",
        "topic": "Python Loops",
        "difficulty": "Beginner",

        "description": (
            "Create a function called count_even(numbers) "
            "that returns how many even numbers are in the list."
        ),

        "function_name": "count_even",

        "starter_code": """def count_even(numbers):
    # Write your code here
    pass
""",

        "tests": [
            {
                "args": [[1, 2, 3, 4]],
                "expected": 2
            },
            {
                "args": [[2, 4, 6, 8]],
                "expected": 4
            },
            {
                "args": [[1, 3, 5]],
                "expected": 0
            },
            {
                "args": [[]],
                "expected": 0
            }
        ]
    },


    "python_003": {
        "id": "python_003",
        "title": "Reverse a String",
        "topic": "Python Strings",
        "difficulty": "Beginner",

        "description": (
            "Create a function called reverse_text(text) "
            "that returns the string in reverse order."
        ),

        "function_name": "reverse_text",

        "starter_code": """def reverse_text(text):
    # Write your code here
    pass
""",

        "tests": [
            {
                "args": ["python"],
                "expected": "nohtyp"
            },
            {
                "args": ["RAG"],
                "expected": "GAR"
            },
            {
                "args": [""],
                "expected": ""
            },
            {
                "args": ["InterviewForge"],
                "expected": "egroFweivretnI"
            }
        ]
    }
}


# ==================================================
# GET ALL EXERCISES
# ==================================================

def get_exercises():

    exercises = []

    for exercise in EXERCISES.values():

        exercises.append(
            {
                "id": exercise["id"],
                "title": exercise["title"],
                "topic": exercise["topic"],
                "difficulty": exercise["difficulty"],
                "description": exercise["description"],
                "starter_code": exercise["starter_code"],
            }
        )

    return exercises


# ==================================================
# GET ONE EXERCISE
# ==================================================

def get_exercise(exercise_id):

    return EXERCISES.get(
        exercise_id
    )


# ==================================================
# SAVE ATTEMPT
# ==================================================

def save_attempt(
    exercise,
    code,
    passed,
    score,
    feedback
):

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute(
        """
        INSERT INTO coding_attempts (
            exercise_id,
            topic,
            difficulty,
            code,
            passed,
            score,
            feedback
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,

        (
            exercise["id"],
            exercise["topic"],
            exercise["difficulty"],
            code,
            1 if passed else 0,
            score,
            feedback,
        )
    )


    cursor.execute(
        """
        INSERT INTO practice_activity (
            activity_type,
            topic,
            score
        )
        VALUES (?, ?, ?)
        """,

        (
            "coding",
            exercise["topic"],
            score,
        )
    )


    connection.commit()

    connection.close()


# ==================================================
# RUN CODE TESTS
# ==================================================

def run_tests(
    exercise,
    code
):

    function_name = exercise[
        "function_name"
    ]

    tests = exercise[
        "tests"
    ]


    with tempfile.TemporaryDirectory() as temp_dir:

        temp_path = Path(
            temp_dir
        )

        solution_path = (
            temp_path
            / "solution.py"
        )

        runner_path = (
            temp_path
            / "runner.py"
        )


        # ------------------------------------------
        # Save user's code
        # ------------------------------------------

        solution_path.write_text(
            code,
            encoding="utf-8"
        )


        # ------------------------------------------
        # Test runner
        # ------------------------------------------

        runner_code = f"""
import json
import importlib.util


solution_path = r"{solution_path}"


spec = importlib.util.spec_from_file_location(
    "solution",
    solution_path
)


solution = importlib.util.module_from_spec(
    spec
)


spec.loader.exec_module(
    solution
)


function_name = {json.dumps(function_name)}

tests = {json.dumps(tests)}


if not hasattr(
    solution,
    function_name
):
    print(
        json.dumps(
            {{
                "error":
                f"Required function '{{function_name}}' was not found."
            }}
        )
    )

    raise SystemExit


function = getattr(
    solution,
    function_name
)


results = []


for test_number, test in enumerate(
    tests,
    start=1
):

    try:

        actual = function(
            *test["args"]
        )


        passed = (
            actual
            == test["expected"]
        )


        results.append(
            {{
                "test": test_number,
                "passed": passed,
                "expected": test["expected"],
                "actual": actual
            }}
        )


    except Exception as error:

        results.append(
            {{
                "test": test_number,
                "passed": False,
                "expected": test["expected"],
                "actual": None,
                "error": str(error)
            }}
        )


print(
    json.dumps(
        {{
            "results": results
        }}
    )
)
"""


        runner_path.write_text(
            runner_code,
            encoding="utf-8"
        )


        # ------------------------------------------
        # Run in separate Python process
        # ------------------------------------------

        try:

            process = subprocess.run(
                [
                    sys.executable,
                    str(runner_path)
                ],

                cwd=temp_path,

                capture_output=True,

                text=True,

                timeout=5
            )


        except subprocess.TimeoutExpired:

            return {
                "passed": False,
                "score": 0,
                "feedback": (
                    "Your code took too long to run. "
                    "Check for an infinite loop."
                ),
                "tests": []
            }


        # ------------------------------------------
        # Python syntax/runtime failure
        # ------------------------------------------

        if process.returncode != 0:

            return {
                "passed": False,
                "score": 0,

                "feedback": (
                    "Your code produced an error:\n"
                    + process.stderr.strip()
                ),

                "tests": []
            }


        # ------------------------------------------
        # Parse test results
        # ------------------------------------------

        try:

            output = json.loads(
                process.stdout.strip()
            )


        except json.JSONDecodeError:

            return {
                "passed": False,
                "score": 0,

                "feedback": (
                    "The code ran, but the evaluator "
                    "could not read the test result."
                ),

                "tests": []
            }


        if "error" in output:

            return {
                "passed": False,
                "score": 0,
                "feedback": output["error"],
                "tests": []
            }


        results = output[
            "results"
        ]


        passed_tests = sum(
            1
            for result in results
            if result["passed"]
        )


        total_tests = len(
            results
        )


        score = round(
            (
                passed_tests
                / total_tests
            )
            * 100
        )


        all_passed = (
            passed_tests
            == total_tests
        )


        if all_passed:

            feedback = (
                "Excellent. All test cases passed."
            )

        else:

            feedback = (
                f"{passed_tests} of "
                f"{total_tests} test cases passed. "
                "Review the failed test cases."
            )


        return {
            "passed": all_passed,
            "score": score,
            "feedback": feedback,
            "tests": results
        }


# ==================================================
# EVALUATE SUBMISSION
# ==================================================

def evaluate_submission(
    exercise_id,
    code
):

    exercise = get_exercise(
        exercise_id
    )


    if not exercise:

        return {
            "error":
            "Exercise not found."
        }


    result = run_tests(
        exercise,
        code
    )


    save_attempt(
        exercise=exercise,

        code=code,

        passed=result[
            "passed"
        ],

        score=result[
            "score"
        ],

        feedback=result[
            "feedback"
        ]
    )


    return {
        "exercise_id":
        exercise_id,

        "title":
        exercise["title"],

        **result
    }


# ==================================================
# LOCAL TEST
# ==================================================

if __name__ == "__main__":

    initialize_database()


    print(
        "InterviewForge Coding Gym"
    )

    print(
        "-" * 40
    )


    # Test the evaluator with a correct solution.

    demo_code = """
def sum_numbers(numbers):
    return sum(numbers)
"""


    result = evaluate_submission(
        "python_001",
        demo_code
    )


    print(
        json.dumps(
            result,
            indent=2
        )
    )