export interface Question {
    id: string;
    type: 'mcq' | 'output_guess' | 'debugging' | 'dsa' | 'resume_deep';
    question: string;
    options?: string[];
    correctAnswer?: string;
    code?: string;
    language?: string;
    starterCode?: Record<string, string>;
    explanation?: string;
    project?: string;
    followUp?: string;
}

export const QUESTION_BANK: Question[] = [
    // === 5 MCQs ===
    {
        id: 'mcq_1',
        type: 'mcq',
        question: 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswer: 'O(log n)',
        explanation: 'A balanced BST halves the search space at each step, giving O(log n) average and worst-case search complexity.',
    },
    {
        id: 'mcq_2',
        type: 'mcq',
        question: 'Which data structure uses LIFO (Last In, First Out) ordering?',
        options: ['Queue', 'Stack', 'Heap', 'Linked List'],
        correctAnswer: 'Stack',
        explanation: 'Stacks use LIFO — the last element pushed is the first to be popped.',
    },
    {
        id: 'mcq_3',
        type: 'mcq',
        question: 'What does the CAP theorem state in distributed systems?',
        options: [
            'A distributed system can guarantee Consistency, Availability, and Partition tolerance simultaneously',
            'A distributed system can guarantee at most two of: Consistency, Availability, Partition tolerance',
            'Consistency is always more important than Availability',
            'Partition tolerance is optional in distributed systems',
        ],
        correctAnswer: 'A distributed system can guarantee at most two of: Consistency, Availability, Partition tolerance',
        explanation: 'CAP theorem: you can only pick two of C, A, P in a distributed system.',
    },
    {
        id: 'mcq_4',
        type: 'mcq',
        question: 'Which sorting algorithm is most efficient on an already nearly-sorted array?',
        options: ['Merge Sort', 'Quick Sort', 'Bubble Sort', 'Insertion Sort'],
        correctAnswer: 'Insertion Sort',
        explanation: 'Insertion Sort runs in O(n) when the array is nearly sorted, making it optimal for this case.',
    },
    {
        id: 'mcq_5',
        type: 'mcq',
        question: 'What is the primary purpose of a hash function in a HashMap?',
        options: [
            'To sort keys alphabetically',
            'To map keys to array indices for O(1) average access',
            'To ensure keys are unique strings',
            'To compress data for storage',
        ],
        correctAnswer: 'To map keys to array indices for O(1) average access',
        explanation: 'Hash functions convert keys to array indices, enabling average O(1) get/put operations.',
    },

    // === 2 Output Guess ===
    {
        id: 'output_1',
        type: 'output_guess',
        question: 'What will be the output of the following Python code?',
        code: `x = [1, 2, 3]
y = x
y.append(4)
print(x)
print(y is x)`,
        language: 'python',
        correctAnswer: '[1, 2, 3, 4]\nTrue',
        explanation: 'In Python, y = x does not copy the list — both variables reference the same object. So appending to y also modifies x.',
    },
    {
        id: 'output_2',
        type: 'output_guess',
        question: 'What does this JavaScript snippet print to the console?',
        code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
        language: 'javascript',
        correctAnswer: '3\n3\n3',
        explanation: 'var is function-scoped, so all three callbacks share the same i. By the time they execute, the loop has ended and i = 3.',
    },

    // === 2 Debugging ===
    {
        id: 'debug_1',
        type: 'debugging',
        question: 'The following Python function to compute factorial is broken. Find and fix the bug:',
        code: `def factorial(n):
    if n == 0:
        return 0   # Bug is here
    return n * factorial(n - 1)

print(factorial(5))  # Should print 120`,
        language: 'python',
        correctAnswer: 'Change return 0 to return 1. The base case of factorial is factorial(0) = 1, not 0.',
        explanation: 'The base case should return 1. Returning 0 causes the entire product to be 0.',
    },
    {
        id: 'debug_2',
        type: 'debugging',
        question: 'This binary search implementation never finds the target. Identify the bug:',
        code: `def binary_search(arr, target):
    left, right = 0, len(arr)   # Bug is here
    while left < right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid
    return -1`,
        language: 'python',
        correctAnswer: 'Change len(arr) to len(arr) - 1. The right pointer should start at the last valid index.',
        explanation: 'right = len(arr) is out of bounds. It should be len(arr) - 1.',
    },

    // === 2 DSA Coding ===
    {
        id: 'dsa_1',
        type: 'dsa',
        question: `**Two Sum**

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

**Example:**
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] = 2 + 7 = 9
\`\`\`

**Constraints:**
- 2 ≤ nums.length ≤ 10⁴  
- Only one valid answer exists.

*Aim for O(n) time complexity.*`,
        starterCode: {
            python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Your solution here
    pass

# Test
print(twoSum([2, 7, 11, 15], 9))  # Expected: [0, 1]
print(twoSum([3, 2, 4], 6))       # Expected: [1, 2]`,
            java: `import java.util.*;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your solution here
        return new int[]{};
    }
    
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(Arrays.toString(sol.twoSum(new int[]{2,7,11,15}, 9)));
    }
}`,
            cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Your solution here
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    auto result = twoSum(nums, 9);
    cout << "[" << result[0] << ", " << result[1] << "]" << endl;
    return 0;
}`,
        },
        explanation: 'Use a hash map: for each num, check if (target - num) exists in the map. O(n) time, O(n) space.',
    },
    {
        id: 'dsa_2',
        type: 'dsa',
        question: `**Valid Parentheses**

Given a string \`s\` containing only the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

A string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

**Example:**
\`\`\`
Input: s = "()[]{}"  → Output: true
Input: s = "(]"      → Output: false
Input: s = "{[]}"    → Output: true
\`\`\``,
        starterCode: {
            python: `def isValid(s: str) -> bool:
    # Your solution here
    pass

# Tests
print(isValid("()[]{}"))  # True
print(isValid("(]"))      # False
print(isValid("{[]}"))    # True`,
            java: `public class Solution {
    public boolean isValid(String s) {
        // Your solution here
        return false;
    }
    
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(sol.isValid("()[]{}"));  // true
        System.out.println(sol.isValid("(]"));       // false
    }
}`,
            cpp: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

bool isValid(string s) {
    // Your solution here
    return false;
}

int main() {
    cout << isValid("()[]{}") << endl;  // 1 (true)
    cout << isValid("(]") << endl;       // 0 (false)
}`,
        },
        explanation: 'Use a stack: push opening brackets, pop and verify matching on closing brackets.',
    },

    // === 2 Resume Deep Dive (placeholders, filled dynamically) ===
    {
        id: 'resume_1',
        type: 'resume_deep',
        question: 'Tell me about a major technical challenge you encountered in your most significant project and how you resolved it.',
        followUp: 'What would you do differently if you built it again today?',
    },
    {
        id: 'resume_2',
        type: 'resume_deep',
        question: 'Walk me through the architecture of your second project. How did you make key technology choices?',
        followUp: 'How would you scale this system to handle 10x the load?',
    },
];

export const QUESTION_ORDER: Question['type'][] = [
    'mcq', 'mcq', 'mcq', 'mcq', 'mcq',
    'output_guess', 'output_guess',
    'debugging', 'debugging',
    'dsa', 'dsa',
    'resume_deep', 'resume_deep',
];
