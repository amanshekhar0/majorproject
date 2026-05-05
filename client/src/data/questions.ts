export interface Question {
  id: string;
  type:
    | "mcq"
    | "output_guess"
    | "debugging"
    | "dsa"
    | "resume_deep"
    | "behavioral";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options?: string[];
  correctAnswer?: string;
  code?: string;
  language?: string;
  starterCode?: Record<string, string>;
  explanation?: string;
  project?: string;
  followUp?: string;
  timeLimit?: number; // in seconds
}

// ─── EASY QUESTIONS ──────────────────────────────────────────────────────────
const EASY_QUESTIONS: Question[] = [
  {
    id: "e_mcq_1",
    type: "mcq",
    difficulty: "easy",
    question:
      "What is the time complexity of accessing an element in an array by index?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correctAnswer: "O(1)",
    explanation:
      "Arrays store elements in contiguous memory, so index-based access is always O(1).",
    timeLimit: 90,
  },
  {
    id: "e_mcq_2",
    type: "mcq",
    difficulty: "easy",
    question: "Which data structure uses LIFO (Last In, First Out) ordering?",
    options: ["Queue", "Stack", "Heap", "Linked List"],
    correctAnswer: "Stack",
    explanation:
      "Stacks use LIFO — the last element pushed is the first to be popped.",
    timeLimit: 90,
  },
  {
    id: "e_mcq_3",
    type: "mcq",
    difficulty: "easy",
    question: "What does HTML stand for?",
    options: [
      "HyperText Markup Language",
      "HighText Machine Language",
      "HyperText Machine Learning",
      "HyperTransfer Markup Language",
    ],
    correctAnswer: "HyperText Markup Language",
    explanation:
      "HTML stands for HyperText Markup Language — the standard language for creating web pages.",
    timeLimit: 90,
  },
  {
    id: "e_mcq_4",
    type: "mcq",
    difficulty: "easy",
    question: "Which of the following is NOT a JavaScript data type?",
    options: ["String", "Boolean", "Integer", "Undefined"],
    correctAnswer: "Integer",
    explanation:
      "JavaScript has Number (not Integer), String, Boolean, Null, Undefined, Symbol, and BigInt.",
    timeLimit: 90,
  },
  {
    id: "e_mcq_5",
    type: "mcq",
    difficulty: "easy",
    question: 'What is the result of 3 + "3" in JavaScript?',
    options: ['"33"', "6", "NaN", "TypeError"],
    correctAnswer: '"33"',
    explanation:
      'JavaScript coerces the number 3 to a string, resulting in string concatenation: "33".',
    timeLimit: 90,
  },
  {
    id: "e_output_1",
    type: "output_guess",
    difficulty: "easy",
    question: "What will be printed by this Python code?",
    code: `x = 5
y = 2
print(x // y)
print(x % y)`,
    language: "python",
    correctAnswer: "2\n1",
    explanation: "// is floor division (5//2 = 2), % is modulus (5%2 = 1).",
    timeLimit: 120,
  },
  {
    id: "e_output_2",
    type: "output_guess",
    difficulty: "easy",
    question: "What does this JavaScript snippet print?",
    code: `let a = [1, 2, 3];
console.log(a.length);
a.push(4);
console.log(a.length);`,
    language: "javascript",
    correctAnswer: "3\n4",
    explanation:
      "Array starts with 3 elements; push() adds one more, making length 4.",
    timeLimit: 120,
  },
  {
    id: "e_debug_1",
    type: "debugging",
    difficulty: "easy",
    question:
      "This Python function to find the maximum of two numbers has a bug. Find it:",
    code: `def find_max(a, b):
    if a > b:
        return b   # Bug here
    return b

print(find_max(10, 5))  # Should print 10`,
    language: "python",
    correctAnswer:
      'Change "return b" inside the if-block to "return a". When a > b, we should return a.',
    explanation:
      "The function mistakenly returns b when a is larger. The fix: return a in the if branch.",
    timeLimit: 150,
  },
  {
    id: "e_dsa_1",
    type: "dsa",
    difficulty: "easy",
    question: `**Reverse a String**

Write a function that takes a string and returns it reversed.

**Example:**
\`\`\`
Input:  "hello"
Output: "olleh"

Input:  "abcde"
Output: "edcba"
\`\`\`

*Hint: You can use slicing in Python.*`,
    starterCode: {
      python: `def reverse_string(s: str) -> str:
    # Your solution here
    pass

print(reverse_string("hello"))   # "olleh"
print(reverse_string("abcde"))   # "edcba"`,
      java: `public class Main {
    public String reverseString(String s) {
        // Your solution here
        return "";
    }

    public static void main(String[] args) {
        Main sol = new Main();
        System.out.println(sol.reverseString("hello"));  // olleh
    }
}`,
      cpp: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

string reverseString(string s) {
    // Your solution here
    return "";
}

int main() {
    cout << reverseString("hello") << endl;  // olleh
}`,
    },
    explanation:
      "Python: return s[::-1]. Others: reverse the character array or use StringBuilder.reverse().",
    timeLimit: 600,
  },
  {
    id: "e_beh_1",
    type: "behavioral",
    difficulty: "easy",
    question:
      "**Accountability**\nTell me about a time you missed a deadline or overlooked a mistake. What did you share with teammates and how did you follow up?",
    followUp:
      "Use STAR briefly: what you learned and what safeguards you built afterward.",
    timeLimit: 240,
  },
  {
    id: "e_beh_2",
    type: "behavioral",
    difficulty: "easy",
    question:
      "**Growth mindset**\nShare a stretch assignment where you were not the expert.",
    followUp: "Highlight how you asked for support and communicated progress.",
    timeLimit: 240,
  },
  {
    id: "e_resume_1",
    type: "resume_deep",
    difficulty: "easy",
    question: "Tell me about yourself and why you chose software engineering.",
    followUp: "What excites you the most about technology?",
    timeLimit: 180,
  },
  {
    id: "e_resume_2",
    type: "resume_deep",
    difficulty: "easy",
    question:
      "Walk me through a project you are most proud of. What was your role?",
    followUp: "What was the biggest challenge and how did you overcome it?",
    timeLimit: 180,
  },
];

// ─── MEDIUM QUESTIONS ─────────────────────────────────────────────────────────
const MEDIUM_QUESTIONS: Question[] = [
  {
    id: "m_mcq_1",
    type: "mcq",
    difficulty: "medium",
    question:
      "What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: "O(log n)",
    explanation:
      "A balanced BST halves the search space at each step, giving O(log n) time.",
    timeLimit: 90,
  },
  {
    id: "m_mcq_2",
    type: "mcq",
    difficulty: "medium",
    question: "What does the CAP theorem state in distributed systems?",
    options: [
      "A distributed system can guarantee Consistency, Availability, and Partition tolerance simultaneously",
      "A distributed system can guarantee at most two of: Consistency, Availability, Partition tolerance",
      "Consistency is always more important than Availability",
      "Partition tolerance is optional in distributed systems",
    ],
    correctAnswer:
      "A distributed system can guarantee at most two of: Consistency, Availability, Partition tolerance",
    explanation:
      "CAP theorem: you can only pick two of C, A, P in a distributed system.",
    timeLimit: 90,
  },
  {
    id: "m_mcq_3",
    type: "mcq",
    difficulty: "medium",
    question:
      "Which sorting algorithm is most efficient on an already nearly-sorted array?",
    options: ["Merge Sort", "Quick Sort", "Bubble Sort", "Insertion Sort"],
    correctAnswer: "Insertion Sort",
    explanation: "Insertion Sort runs in O(n) when the array is nearly sorted.",
    timeLimit: 90,
  },
  {
    id: "m_mcq_4",
    type: "mcq",
    difficulty: "medium",
    question: "What is the primary purpose of a hash function in a HashMap?",
    options: [
      "To sort keys alphabetically",
      "To map keys to array indices for O(1) average access",
      "To ensure keys are unique strings",
      "To compress data for storage",
    ],
    correctAnswer: "To map keys to array indices for O(1) average access",
    explanation:
      "Hash functions convert keys to indices, enabling average O(1) get/put operations.",
    timeLimit: 90,
  },
  {
    id: "m_mcq_5",
    type: "mcq",
    difficulty: "medium",
    question:
      "In React, what is the purpose of the `useEffect` hook with an empty dependency array `[]`?",
    options: [
      "It runs on every render",
      "It runs only once after the initial render",
      "It runs before every render",
      "It prevents re-renders",
    ],
    correctAnswer: "It runs only once after the initial render",
    explanation:
      "An empty dependency array [] makes useEffect behave like componentDidMount — runs once.",
    timeLimit: 90,
  },
  {
    id: "m_output_1",
    type: "output_guess",
    difficulty: "medium",
    question: "What will be the output of the following Python code?",
    code: `x = [1, 2, 3]
y = x
y.append(4)
print(x)
print(y is x)`,
    language: "python",
    correctAnswer: "[1, 2, 3, 4]\nTrue",
    explanation:
      "y = x does not copy — both point to the same object. Appending to y also changes x.",
    timeLimit: 120,
  },
  {
    id: "m_output_2",
    type: "output_guess",
    difficulty: "medium",
    question: "What does this JavaScript snippet print to the console?",
    code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
    language: "javascript",
    correctAnswer: "3\n3\n3",
    explanation:
      "var is function-scoped; by the time callbacks run, the loop has ended and i = 3.",
    timeLimit: 120,
  },
  {
    id: "m_debug_1",
    type: "debugging",
    difficulty: "medium",
    question:
      "The following Python function to compute factorial is broken. Find and fix the bug:",
    code: `def factorial(n):
    if n == 0:
        return 0   # Bug is here
    return n * factorial(n - 1)

print(factorial(5))  # Should print 120`,
    language: "python",
    correctAnswer:
      "Change return 0 to return 1. The base case of factorial is factorial(0) = 1, not 0.",
    explanation:
      "The base case should return 1. Returning 0 causes the entire product to be 0.",
    timeLimit: 150,
  },
  {
    id: "m_debug_2",
    type: "debugging",
    difficulty: "medium",
    question:
      "This binary search implementation never finds the target. Identify the bug:",
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
    language: "python",
    correctAnswer:
      "Change len(arr) to len(arr) - 1. The right pointer should start at the last valid index.",
    explanation:
      "right = len(arr) is out of bounds. It should be len(arr) - 1.",
    timeLimit: 150,
  },
  {
    id: "m_dsa_1",
    type: "dsa",
    difficulty: "medium",
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

public class Main {
    public int[] twoSum(int[] nums, int target) {
        // Your solution here
        return new int[]{};
    }
    
    public static void main(String[] args) {
        Main sol = new Main();
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
    explanation:
      "Use a hash map: for each num, check if (target - num) exists. O(n) time, O(n) space.",
    timeLimit: 900,
  },
  {
    id: "m_dsa_2",
    type: "dsa",
    difficulty: "medium",
    question: `**Valid Parentheses**

Given a string \`s\` containing only \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

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
      java: `public class Main {
    public boolean isValid(String s) {
        // Your solution here
        return false;
    }
    
    public static void main(String[] args) {
        Main sol = new Main();
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
    explanation:
      "Use a stack: push opening brackets, pop and verify matching on closing brackets.",
    timeLimit: 900,
  },
  {
    id: "m_beh_1",
    type: "behavioral",
    difficulty: "medium",
    question:
      "**Collaboration**\nDescribe a disagreement with someone on priorities. How did you align stakeholders?",
    followUp: "Be specific about compromises and measurable outcomes.",
    timeLimit: 300,
  },
  {
    id: "m_beh_2",
    type: "behavioral",
    difficulty: "medium",
    question:
      "**Customer empathy**\nWalk me through a time you advocated for UX or fairness when pressured to ship fast.",
    followUp: "Mention STAR plus any data or anecdotes you surfaced.",
    timeLimit: 300,
  },
  {
    id: "m_resume_1",
    type: "resume_deep",
    difficulty: "medium",
    question:
      "Tell me about a major technical challenge you encountered in your most significant project and how you resolved it.",
    followUp: "What would you do differently if you built it again today?",
    timeLimit: 240,
  },
  {
    id: "m_resume_2",
    type: "resume_deep",
    difficulty: "medium",
    question:
      "Walk me through the architecture of your second project. How did you make key technology choices?",
    followUp: "How would you scale this system to handle 10x the load?",
    timeLimit: 240,
  },
];

// ─── HARD QUESTIONS ───────────────────────────────────────────────────────────
const HARD_QUESTIONS: Question[] = [
  {
    id: "h_mcq_1",
    type: "mcq",
    difficulty: "hard",
    question: "What is the worst-case time complexity of QuickSort?",
    options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
    correctAnswer: "O(n²)",
    explanation:
      "QuickSort degrades to O(n²) when the pivot is always the smallest or largest element (e.g., sorted array with naive pivot).",
    timeLimit: 90,
  },
  {
    id: "h_mcq_2",
    type: "mcq",
    difficulty: "hard",
    question:
      "In a microservices architecture, which pattern ensures data consistency across services without distributed transactions?",
    options: ["SAGA pattern", "CQRS", "Circuit Breaker", "API Gateway"],
    correctAnswer: "SAGA pattern",
    explanation:
      "The SAGA pattern uses a sequence of local transactions with compensating transactions to maintain consistency without 2PC.",
    timeLimit: 90,
  },
  {
    id: "h_mcq_3",
    type: "mcq",
    difficulty: "hard",
    question: "What does the `volatile` keyword guarantee in Java?",
    options: [
      "Atomicity of operations on the variable",
      "Visibility of changes across threads and prevention of reordering",
      "Thread-safe access with mutual exclusion",
      "The variable is immutable",
    ],
    correctAnswer:
      "Visibility of changes across threads and prevention of reordering",
    explanation:
      "volatile ensures all threads see the latest value and prevents instruction reordering, but does NOT guarantee atomicity.",
    timeLimit: 90,
  },
  {
    id: "h_mcq_4",
    type: "mcq",
    difficulty: "hard",
    question:
      "What is the time and space complexity of Dijkstra's algorithm using a min-heap?",
    options: [
      "O(V²) time, O(V) space",
      "O((V + E) log V) time, O(V + E) space",
      "O(E log E) time, O(E) space",
      "O(V log V) time, O(V) space",
    ],
    correctAnswer: "O((V + E) log V) time, O(V + E) space",
    explanation:
      "With a binary min-heap, each of E edge relaxations costs O(log V), giving O((V+E) log V) total.",
    timeLimit: 90,
  },
  {
    id: "h_mcq_5",
    type: "mcq",
    difficulty: "hard",
    question:
      "Which HTTP caching mechanism allows a browser to confirm with the server that its cached resource is still fresh?",
    options: [
      "Cache-Control: no-store",
      "ETag + If-None-Match",
      "Pragma: no-cache",
      "Expires header",
    ],
    correctAnswer: "ETag + If-None-Match",
    explanation:
      "ETag is a hash of the resource. The browser sends it via If-None-Match; server returns 304 Not Modified if unchanged.",
    timeLimit: 90,
  },
  {
    id: "h_output_1",
    type: "output_guess",
    difficulty: "hard",
    question:
      "What is the output of this Python code involving closures and mutable defaults?",
    code: `def make_adders(nums):
    return [lambda x: x + n for n in nums]

adders = make_adders([1, 2, 3])
print(adders[0](10))
print(adders[1](10))
print(adders[2](10))`,
    language: "python",
    correctAnswer: "13\n13\n13",
    explanation:
      "All lambdas capture n by reference. By the time they're called, the loop has ended and n = 3, so all return 10 + 3 = 13.",
    timeLimit: 150,
  },
  {
    id: "h_output_2",
    type: "output_guess",
    difficulty: "hard",
    question: "What does this JavaScript Promise chain print?",
    code: `Promise.resolve(1)
  .then(x => { throw x + 1; })
  .catch(x => x + 1)
  .then(x => console.log(x));`,
    language: "javascript",
    correctAnswer: "3",
    explanation:
      "resolve(1) → then throws 2 → catch receives 2 and returns 3 → then logs 3.",
    timeLimit: 150,
  },
  {
    id: "h_debug_1",
    type: "debugging",
    difficulty: "hard",
    question:
      "This memoized Fibonacci implementation has a subtle bug causing wrong results. Find it:",
    code: `memo = {}

def fib(n):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    result = fib(n - 1) + fib(n - 2)
    memo[n] = result
    return memo[n - 1]  # Bug here

print(fib(10))  # Should print 55`,
    language: "python",
    correctAnswer:
      'Change "return memo[n - 1]" to "return result". The function stores result correctly but returns the wrong cached value.',
    explanation:
      "memo[n] is correctly set, but the function returns memo[n-1] instead of memo[n] (or result).",
    timeLimit: 180,
  },
  {
    id: "h_debug_2",
    type: "debugging",
    difficulty: "hard",
    question:
      "This async JavaScript function has a concurrency bug. Identify it:",
    code: `async function fetchAll(urls) {
    const results = [];
    for (const url of urls) {
        const res = await fetch(url);  // Bug: sequential fetching
        results.push(await res.json());
    }
    return results;
}`,
    language: "javascript",
    correctAnswer:
      "The bug is sequential awaiting inside a loop. Fix: use Promise.all(urls.map(url => fetch(url).then(r => r.json()))) to fetch in parallel.",
    explanation:
      "Awaiting inside a for loop makes requests sequential. Promise.all runs them concurrently, dramatically reducing total time.",
    timeLimit: 180,
  },
  {
    id: "h_dsa_1",
    type: "dsa",
    difficulty: "hard",
    question: `**Longest Substring Without Repeating Characters**

Given a string \`s\`, find the length of the longest substring without repeating characters.

**Example:**
\`\`\`
Input: s = "abcabcbb"  → Output: 3  ("abc")
Input: s = "bbbbb"     → Output: 1  ("b")
Input: s = "pwwkew"    → Output: 3  ("wke")
\`\`\`

**Constraints:** 0 ≤ s.length ≤ 5 × 10⁴

*Aim for O(n) using a sliding window.*`,
    starterCode: {
      python: `def lengthOfLongestSubstring(s: str) -> int:
    # Your solution here
    pass

print(lengthOfLongestSubstring("abcabcbb"))  # 3
print(lengthOfLongestSubstring("bbbbb"))     # 1
print(lengthOfLongestSubstring("pwwkew"))    # 3`,
      java: `import java.util.*;

public class Main {
    public int lengthOfLongestSubstring(String s) {
        // Your solution here
        return 0;
    }

    public static void main(String[] args) {
        Main sol = new Main();
        System.out.println(sol.lengthOfLongestSubstring("abcabcbb"));  // 3
        System.out.println(sol.lengthOfLongestSubstring("pwwkew"));    // 3
    }
}`,
      cpp: `#include <iostream>
#include <unordered_map>
#include <string>
using namespace std;

int lengthOfLongestSubstring(string s) {
    // Your solution here
    return 0;
}

int main() {
    cout << lengthOfLongestSubstring("abcabcbb") << endl;  // 3
    cout << lengthOfLongestSubstring("pwwkew") << endl;    // 3
}`,
    },
    explanation:
      "Use a sliding window with a hashmap tracking last seen index of each char. Move left pointer when a repeat is found.",
    timeLimit: 1200,
  },
  {
    id: "h_dsa_2",
    type: "dsa",
    difficulty: "hard",
    question: `**Merge Intervals**

Given an array of intervals where \`intervals[i] = [start, end]\`, merge all overlapping intervals and return the result.

**Example:**
\`\`\`
Input:  [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]

Input:  [[1,4],[4,5]]
Output: [[1,5]]
\`\`\`

**Constraints:** 1 ≤ intervals.length ≤ 10⁴

*Think: sort first, then scan.*`,
    starterCode: {
      python: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    # Your solution here
    pass

print(merge([[1,3],[2,6],[8,10],[15,18]]))  # [[1,6],[8,10],[15,18]]
print(merge([[1,4],[4,5]]))                 # [[1,5]]`,
      java: `import java.util.*;

public class Main {
    public int[][] merge(int[][] intervals) {
        // Your solution here
        return new int[][]{};
    }

    public static void main(String[] args) {
        Main sol = new Main();
        System.out.println(Arrays.deepToString(
            sol.merge(new int[][]{{1,3},{2,6},{8,10},{15,18}})
        ));
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

vector<vector<int>> merge(vector<vector<int>>& intervals) {
    // Your solution here
    return {};
}

int main() {
    vector<vector<int>> v = {{1,3},{2,6},{8,10},{15,18}};
    auto res = merge(v);
    for (auto& r : res) cout << "[" << r[0] << "," << r[1] << "] ";
}`,
    },
    explanation:
      "Sort by start time. Iterate and merge if current start <= last end. O(n log n) time.",
    timeLimit: 1200,
  },
  {
    id: "h_beh_1",
    type: "behavioral",
    difficulty: "hard",
    question:
      "**Leadership**\nTell me how you coached someone who was struggling without micromanaging.",
    followUp: "Discuss feedback cadence and how success was measured.",
    timeLimit: 360,
  },
  {
    id: "h_beh_2",
    type: "behavioral",
    difficulty: "hard",
    question:
      "**Ethics & trade-offs**\nShare a scenario where optimizing for velocity could have hurt reliability or inclusivity.",
    followUp:
      "How did you frame the debate and what safeguards did you put in place?",
    timeLimit: 360,
  },
  {
    id: "h_resume_1",
    type: "resume_deep",
    difficulty: "hard",
    question:
      "Walk me through the most complex system you've built. How did you handle scalability and data consistency?",
    followUp:
      "What trade-offs did you make and what would you change with more time?",
    timeLimit: 300,
  },
  {
    id: "h_resume_2",
    type: "resume_deep",
    difficulty: "hard",
    question:
      "Describe a time you had to optimize a slow feature. What was your approach, and what was the measurable impact?",
    followUp:
      "How would you have caught this performance issue earlier in development?",
    timeLimit: 300,
  },
];

// ─── Combined bank by difficulty ─────────────────────────────────────────────
export const QUESTION_BANK_BY_DIFFICULTY: Record<
  "easy" | "medium" | "hard",
  Question[]
> = {
  easy: EASY_QUESTIONS,
  medium: MEDIUM_QUESTIONS,
  hard: HARD_QUESTIONS,
};

// Backward-compat default (medium)
export const QUESTION_BANK: Question[] = MEDIUM_QUESTIONS;

export const QUESTION_ORDER: Question["type"][] = [
  "mcq",
  "mcq",
  "mcq",
  "mcq",
  "mcq",
  "output_guess",
  "output_guess",
  "debugging",
  "debugging",
  "dsa",
  "dsa",
  "resume_deep",
  "resume_deep",
];
