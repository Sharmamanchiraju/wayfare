import sys
sys.path.append("/home/sharma/agent-project/backend")

from app.agent.trip_planner import clean_destination

def run_tests():
    print("--- Running Destination Extraction Clean Tests ---")
    
    test_cases = {
        "hello manali": "Manali",
        "umm i want to go to paris i think": "Paris",
        "PARIS!!": "Paris",
        "  tokyo, japan  ": "Tokyo, Japan",
        "i want to visit mumbai, india": "Mumbai, India",
        "please change destination to swiss alps": "Swiss Alps"
    }
    
    success = True
    for input_val, expected in test_cases.items():
        result = clean_destination(input_val)
        print(f"Input: {repr(input_val)} -> Extracted: {repr(result)} (Expected: {repr(expected)})")
        try:
            assert result == expected, f"Expected {repr(expected)}, got {repr(result)}"
        except AssertionError as err:
            print(f"❌ Failed for {repr(input_val)}: {err}")
            success = False
            
    if success:
        print("\n✓ ALL DESTINATION EXTRACTION TESTS PASSED SUCCESSFULLY!")
    else:
        print("\n❌ SOME TESTS FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
