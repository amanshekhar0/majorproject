// ─── Resource links for each question and weak-point topic ───────────────────
// GFG = GeeksForGeeks article, YouTube = NeetCode / Abdul Bari / others

export interface Resource {
    topic: string;
    gfg?: string;
    youtube?: string;
    youtubeLabel?: string;
}

// Per question ID
export const QUESTION_RESOURCES: Record<string, Resource> = {
    // Easy
    e_mcq_1: {
        topic: 'Array Time Complexity',
        gfg: 'https://www.geeksforgeeks.org/analysis-algorithms-big-o-analysis/',
        youtube: 'https://www.youtube.com/watch?v=Mo4vesaut8g',
        youtubeLabel: 'Big-O Notation — CS Dojo',
    },
    e_mcq_2: {
        topic: 'Stack — LIFO Data Structure',
        gfg: 'https://www.geeksforgeeks.org/stack-data-structure/',
        youtube: 'https://www.youtube.com/watch?v=I37kGX-nZEI',
        youtubeLabel: 'Stack Data Structure — mycodeschool',
    },
    e_mcq_3: {
        topic: 'HTML Basics',
        gfg: 'https://www.geeksforgeeks.org/html-introduction/',
        youtube: 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
        youtubeLabel: 'HTML in 12 Minutes — Jake Wright',
    },
    e_mcq_4: {
        topic: 'JavaScript Data Types',
        gfg: 'https://www.geeksforgeeks.org/javascript-data-types/',
        youtube: 'https://www.youtube.com/watch?v=O9by2KcR2v4',
        youtubeLabel: 'JS Data Types — Akshay Saini',
    },
    e_mcq_5: {
        topic: 'JavaScript Type Coercion',
        gfg: 'https://www.geeksforgeeks.org/javascript-type-coercion/',
        youtube: 'https://www.youtube.com/watch?v=C5ZVC4HHgIg',
        youtubeLabel: 'Type Coercion — Fireship',
    },
    e_output_1: {
        topic: 'Python Floor Division & Modulus',
        gfg: 'https://www.geeksforgeeks.org/division-operator-in-python/',
        youtube: 'https://www.youtube.com/watch?v=YbipxqSKx-E',
        youtubeLabel: 'Python Operators — Tech With Tim',
    },
    e_output_2: {
        topic: 'JavaScript Array Methods',
        gfg: 'https://www.geeksforgeeks.org/javascript-array-methods/',
        youtube: 'https://www.youtube.com/watch?v=R8rmfD9Y5-c',
        youtubeLabel: 'Array Methods — Fireship',
    },
    e_debug_1: {
        topic: 'Debugging Python Functions',
        gfg: 'https://www.geeksforgeeks.org/python-debugging/',
        youtube: 'https://www.youtube.com/watch?v=aqf6oSMOEBk',
        youtubeLabel: 'Python Debugging — CS Dojo',
    },
    e_dsa_1: {
        topic: 'String Reversal',
        gfg: 'https://www.geeksforgeeks.org/reverse-a-string-in-python/',
        youtube: 'https://www.youtube.com/watch?v=X7Qzb8U9Eko',
        youtubeLabel: 'String Manipulation — NeetCode',
    },

    // Medium
    m_mcq_1: {
        topic: 'Binary Search Tree — Search Complexity',
        gfg: 'https://www.geeksforgeeks.org/binary-search-tree-data-structure/',
        youtube: 'https://www.youtube.com/watch?v=COZK7NATh4k',
        youtubeLabel: 'BST Explained — mycodeschool',
    },
    m_mcq_2: {
        topic: 'CAP Theorem — Distributed Systems',
        gfg: 'https://www.geeksforgeeks.org/the-cap-theorem-in-dbms/',
        youtube: 'https://www.youtube.com/watch?v=k-Yaq8AHlFA',
        youtubeLabel: 'CAP Theorem — Gaurav Sen',
    },
    m_mcq_3: {
        topic: 'Sorting Algorithms Comparison',
        gfg: 'https://www.geeksforgeeks.org/sorting-algorithms/',
        youtube: 'https://www.youtube.com/watch?v=RfXt_qHDEPw',
        youtubeLabel: 'All Sorting Algorithms — CS Dojo',
    },
    m_mcq_4: {
        topic: 'HashMap — Hash Functions',
        gfg: 'https://www.geeksforgeeks.org/hashing-data-structure/',
        youtube: 'https://www.youtube.com/watch?v=knV86FlSXJ8',
        youtubeLabel: 'Hashing — Abdul Bari',
    },
    m_mcq_5: {
        topic: 'React useEffect Hook',
        gfg: 'https://www.geeksforgeeks.org/reactjs-useeffect-hook/',
        youtube: 'https://www.youtube.com/watch?v=0ZJgIjIuY7U',
        youtubeLabel: 'useEffect Deep Dive — Codevolution',
    },
    m_output_1: {
        topic: 'Python List References vs Copies',
        gfg: 'https://www.geeksforgeeks.org/copy-python-deep-copy-shallow-copy/',
        youtube: 'https://www.youtube.com/watch?v=ZLNhaefJoNk',
        youtubeLabel: 'Python References — Socratica',
    },
    m_output_2: {
        topic: 'JavaScript var/let/const & Closures',
        gfg: 'https://www.geeksforgeeks.org/difference-between-var-let-and-const-keywords-in-javascript/',
        youtube: 'https://www.youtube.com/watch?v=Bv_5Zv5c-Ts',
        youtubeLabel: 'var vs let vs const — Fireship',
    },
    m_debug_1: {
        topic: 'Recursion & Base Cases',
        gfg: 'https://www.geeksforgeeks.org/recursion/',
        youtube: 'https://www.youtube.com/watch?v=IJDJ0kBx2LM',
        youtubeLabel: 'Recursion Explained — mycodeschool',
    },
    m_debug_2: {
        topic: 'Binary Search Algorithm',
        gfg: 'https://www.geeksforgeeks.org/binary-search/',
        youtube: 'https://www.youtube.com/watch?v=xrMppTpoqdw',
        youtubeLabel: 'Binary Search — NeetCode',
    },
    m_dsa_1: {
        topic: 'Two Sum — HashMap Pattern',
        gfg: 'https://www.geeksforgeeks.org/two-sum-using-hash-set/',
        youtube: 'https://www.youtube.com/watch?v=KLlXCFG5TnA',
        youtubeLabel: 'Two Sum — NeetCode',
    },
    m_dsa_2: {
        topic: 'Valid Parentheses — Stack Pattern',
        gfg: 'https://www.geeksforgeeks.org/check-for-balanced-parentheses-in-an-expression/',
        youtube: 'https://www.youtube.com/watch?v=WTzjTskDFMg',
        youtubeLabel: 'Valid Parentheses — NeetCode',
    },

    // Hard
    h_mcq_1: {
        topic: 'QuickSort — Worst Case',
        gfg: 'https://www.geeksforgeeks.org/quick-sort/',
        youtube: 'https://www.youtube.com/watch?v=COk73cpQbFQ',
        youtubeLabel: 'QuickSort — mycodeschool',
    },
    h_mcq_2: {
        topic: 'SAGA Pattern — Microservices',
        gfg: 'https://www.geeksforgeeks.org/saga-design-pattern/',
        youtube: 'https://www.youtube.com/watch?v=WnZ7IcaN_JA',
        youtubeLabel: 'SAGA Pattern — Gaurav Sen',
    },
    h_mcq_3: {
        topic: 'Java volatile Keyword',
        gfg: 'https://www.geeksforgeeks.org/volatile-keyword-in-java/',
        youtube: 'https://www.youtube.com/watch?v=V2hC-g6FoGc',
        youtubeLabel: 'Java Concurrency — Jakob Jenkov',
    },
    h_mcq_4: {
        topic: "Dijkstra's Algorithm Complexity",
        gfg: "https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/",
        youtube: 'https://www.youtube.com/watch?v=XEb7_z5dG3c',
        youtubeLabel: "Dijkstra's — Abdul Bari",
    },
    h_mcq_5: {
        topic: 'HTTP Caching — ETag',
        gfg: 'https://www.geeksforgeeks.org/http-headers-etag/',
        youtube: 'https://www.youtube.com/watch?v=HiBDZgTNpXY',
        youtubeLabel: 'HTTP Caching — Fireship',
    },
    h_output_1: {
        topic: 'Python Closures & Late Binding',
        gfg: 'https://www.geeksforgeeks.org/python-closures/',
        youtube: 'https://www.youtube.com/watch?v=9Os0o3wzS_I',
        youtubeLabel: 'Python Closures — Corey Schafer',
    },
    h_output_2: {
        topic: 'JavaScript Promises & Error Handling',
        gfg: 'https://www.geeksforgeeks.org/javascript-promise/',
        youtube: 'https://www.youtube.com/watch?v=DHvZLI7Db8E',
        youtubeLabel: 'Promises — Fireship',
    },
    h_debug_1: {
        topic: 'Memoization & Dynamic Programming',
        gfg: 'https://www.geeksforgeeks.org/memoization-1d-2d-and-3d/',
        youtube: 'https://www.youtube.com/watch?v=oBt53YbR9Kk',
        youtubeLabel: 'DP for Beginners — freeCodeCamp',
    },
    h_debug_2: {
        topic: 'JavaScript Async/Await & Promise.all',
        gfg: 'https://www.geeksforgeeks.org/javascript-async-await/',
        youtube: 'https://www.youtube.com/watch?v=V_Kr9OSfDeU',
        youtubeLabel: 'Async/Await — Akshay Saini',
    },
    h_dsa_1: {
        topic: 'Sliding Window — Longest Substring',
        gfg: 'https://www.geeksforgeeks.org/longest-substring-without-repeating-characters/',
        youtube: 'https://www.youtube.com/watch?v=wiGpQwVHdE0',
        youtubeLabel: 'Sliding Window — NeetCode',
    },
    h_dsa_2: {
        topic: 'Merge Intervals',
        gfg: 'https://www.geeksforgeeks.org/merging-intervals/',
        youtube: 'https://www.youtube.com/watch?v=44H3cEC2fFM',
        youtubeLabel: 'Merge Intervals — NeetCode',
    },
};

// ─── Keyword-based fallback resources (for AI-generated weak points) ──────────
export const TOPIC_RESOURCES: Record<string, Resource> = {
    'time complexity': {
        topic: 'Big-O Time Complexity',
        gfg: 'https://www.geeksforgeeks.org/analysis-algorithms-big-o-analysis/',
        youtube: 'https://www.youtube.com/watch?v=Mo4vesaut8g',
        youtubeLabel: 'Big-O — CS Dojo',
    },
    'dynamic programming': {
        topic: 'Dynamic Programming',
        gfg: 'https://www.geeksforgeeks.org/dynamic-programming/',
        youtube: 'https://www.youtube.com/watch?v=oBt53YbR9Kk',
        youtubeLabel: 'DP — freeCodeCamp',
    },
    'edge case': {
        topic: 'Writing Robust Code — Edge Cases',
        gfg: 'https://www.geeksforgeeks.org/software-engineering-debugging/',
        youtube: 'https://www.youtube.com/watch?v=qpJaGCcCMXw',
        youtubeLabel: 'Clean Code — Fireship',
    },
    'code optimization': {
        topic: 'Code Optimization Techniques',
        gfg: 'https://www.geeksforgeeks.org/program-optimization-techniques/',
        youtube: 'https://www.youtube.com/watch?v=3WwTbAKRtY4',
        youtubeLabel: 'Writing Efficient Code',
    },
    'two-pointer': {
        topic: 'Two-Pointer Technique',
        gfg: 'https://www.geeksforgeeks.org/two-pointers-technique/',
        youtube: 'https://www.youtube.com/watch?v=On03HWe2tZM',
        youtubeLabel: 'Two Pointers — NeetCode',
    },
    'sliding window': {
        topic: 'Sliding Window Pattern',
        gfg: 'https://www.geeksforgeeks.org/window-sliding-technique/',
        youtube: 'https://www.youtube.com/watch?v=MK-NZ4hN7rs',
        youtubeLabel: 'Sliding Window — NeetCode',
    },
    recursion: {
        topic: 'Recursion',
        gfg: 'https://www.geeksforgeeks.org/recursion/',
        youtube: 'https://www.youtube.com/watch?v=IJDJ0kBx2LM',
        youtubeLabel: 'Recursion — mycodeschool',
    },
    graph: {
        topic: 'Graph Algorithms',
        gfg: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/',
        youtube: 'https://www.youtube.com/watch?v=tWVWeAqZ0WU',
        youtubeLabel: 'Graph Algorithms — freeCodeCamp',
    },
    tree: {
        topic: 'Trees & BST',
        gfg: 'https://www.geeksforgeeks.org/binary-tree-data-structure/',
        youtube: 'https://www.youtube.com/watch?v=oSWTXtMglKE',
        youtubeLabel: 'Binary Trees — mycodeschool',
    },
    heap: {
        topic: 'Heap / Priority Queue',
        gfg: 'https://www.geeksforgeeks.org/heap-data-structure/',
        youtube: 'https://www.youtube.com/watch?v=HqPJF2L5h9U',
        youtubeLabel: 'Heaps — Abdul Bari',
    },
    sorting: {
        topic: 'Sorting Algorithms',
        gfg: 'https://www.geeksforgeeks.org/sorting-algorithms/',
        youtube: 'https://www.youtube.com/watch?v=RfXt_qHDEPw',
        youtubeLabel: 'All Sorts — CS Dojo',
    },
    'system design': {
        topic: 'System Design Fundamentals',
        gfg: 'https://www.geeksforgeeks.org/system-design-tutorial/',
        youtube: 'https://www.youtube.com/watch?v=UzLMhqg3_Wc',
        youtubeLabel: 'System Design — Gaurav Sen',
    },
    async: {
        topic: 'Async Programming',
        gfg: 'https://www.geeksforgeeks.org/javascript-async-await/',
        youtube: 'https://www.youtube.com/watch?v=V_Kr9OSfDeU',
        youtubeLabel: 'Async/Await — Akshay Saini',
    },
    concurrency: {
        topic: 'Concurrency & Threads',
        gfg: 'https://www.geeksforgeeks.org/multithreading-in-java/',
        youtube: 'https://www.youtube.com/watch?v=r_MbozD32eo',
        youtubeLabel: 'Java Threads — Telusko',
    },
};

/**
 * Given a weak point text, return matching topic resources.
 * Checks both keyword and question-id based maps.
 */
export function getResourcesForWeakPoint(text: string): Resource | null {
    const lower = text.toLowerCase();
    for (const [keyword, resource] of Object.entries(TOPIC_RESOURCES)) {
        if (lower.includes(keyword)) return resource;
    }
    return null;
}
