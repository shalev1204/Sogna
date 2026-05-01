from typing import Dict

def my_decorator(func):
    def wrapper():
        print("Something is happening before the function is called.")
        func()
        print("Something is happening after the function is called.")
    return wrapper

class UserProfile:
    pass

@my_decorator
def process_data(data: UserProfile) -> Dict:
    print("Processing data...")
    return {"status": "ok"}
