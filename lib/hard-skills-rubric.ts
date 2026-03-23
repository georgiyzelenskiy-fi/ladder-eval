/**
 * Emplifi hard-skills evaluation rubric (source: internal skill evaluation page).
 * Use for UI, scoring copy, and Convex seeding.
 *
 * Shared level scale and types: `skill-rubric-common`.
 */

export {
  SKILL_LEVEL_DEFINITIONS as HARD_SKILL_LEVEL_DEFINITIONS,
  SKILL_LEVEL_KEYS as HARD_SKILL_LEVEL_KEYS,
  flattenSkillCriteriaStrings as flattenCriteriaStrings,
  type SkillCompetency as HardSkillCompetency,
  type SkillCriterion as HardSkillCriterion,
  type SkillLevelDefinition as HardSkillLevelDefinition,
  type SkillLevelKey as HardSkillLevelKey,
  type SkillLevelNumber as HardSkillLevelNumber,
  type SkillLevelRubric as HardSkillLevelRubric,
} from "./skill-rubric-common";

import type { SkillCompetency } from "./skill-rubric-common";
import { getSkillCompetencyById } from "./skill-rubric-common";

export const HARD_SKILL_SUITABLE_ROLES = [
  "Software Engineer",
  "Coder",
] as const;

export const HARD_SKILL_COMPETENCIES: SkillCompetency[] = [
  {
    id: "code-reviews",
    name: "Code Reviews",
    dimensions: [
      "Quality & Depth",
      "Frequency",
      "Blocking Reviewer Range",
      "Adaptability",
    ],
    levels: [
      {
        number: 1,
        key: "beginner",
        label: "Beginner",
        tagline:
          "I'm learning from code reviews done by others and trying to replicate them",
        criteria: [
          { text: "You think about how the problem would be solved by you" },
          {
            text: "Provide basic feedback during CR, which contains at least notes about:",
            subcriteria: [
              "Inconsistencies with the rest of the code in the repository",
              "Unhandled edge cases",
              "Missing parts (like tests, documentation etc.)",
            ],
          },
          { text: "Continuously improving your CR quality" },
          {
            text: "You understand why we do CRs, its importance and value",
          },
          {
            text: "You do self-review on your own code, before asking other people to do it",
          },
          {
            text: "You are reading CRs related to your work, even when you are not the author or blocking reviewer",
          },
        ],
      },
      {
        number: 2,
        key: "intermediate",
        label: "Intermediate",
        tagline: "I'm doing detailed code reviews and catch most issues in the code",
        criteria: [
          {
            text: "Your CRs are more detailed, mainly within these areas:",
            subcriteria: [
              "Code effectiveness and optimization",
              "Finding redundant parts in code (unnecessary packages, duplicates, etc.)",
              "Legibility of code (and diff itself) and problems it can cause (changes not related with the issue, diff being too long, etc.)",
              "Adding different perspective on how the code could be changed and how to approach the issue",
            ],
          },
          {
            text: "You're able to get quickly familiar with a repository and perform CRs",
          },
          { text: "Look at the changes from a high level perspective." },
          {
            text: "How the change is affecting remaining parts of the repository",
          },
          { text: "If the overall solution has high level quality" },
          {
            text: "Considers how their CR's impact future development",
          },
          { text: "Understand the scope of required changes" },
          {
            text: "You're active (performing CRs on daily basis) blocking reviewer for at least 1 repository",
          },
          {
            text: "A blocking code reviewer status is a requirement for Lvl 2 in CR",
          },
          {
            text: "A blocking code reviewer for a specific repository is defined as someone who's code reviews do not need to be validated by other team members",
          },
          {
            text: "Once someone is a blocking code reviewer, they should reflect this change in Phabricator",
          },
        ],
      },
      {
        number: 3,
        key: "advanced",
        label: "Advanced",
        tagline: "I reached technical pinnacle of the review process",
        criteria: [
          {
            text: "Your CRs are more detailed, mainly within these areas:",
            subcriteria: [
              "Can do (and if it is helpful for understanding then do) extensive research of the related code of affected applications",
              "Show where changes can affect other repositories",
              "Point out why some solutions are better than others, not only whether a solution is good or not",
            ],
          },
          {
            text: "Active blocking reviewer for at least 4 repositories",
          },
          {
            text: "You're able to do more complex revisions by yourself (e.g. 20 files diff with complex logic between them)",
          },
          {
            text: "Able to deal with fluctuating number of CRs within your team",
          },
        ],
      },
      {
        number: 4,
        key: "expert",
        label: "Expert",
        tagline: "I evaluate how others do code reviews",
        criteria: [
          { text: "You evaluate the ability of others being reviewers" },
          {
            text: "Can tell if somebody is ready to be blocking reviewer",
          },
          {
            text: "Can tell progress in quality of somebody's CRs",
          },
          {
            text: "Can pinpoint possible improvements in their CRs",
          },
          { text: "Active blocking reviewer for at least 7 repositories" },
          {
            text: "You are able to effectively deal with occasional large amount of CRs from outside of your team without lowering the quality",
          },
        ],
      },
      {
        number: 5,
        key: "leadingExpert",
        label: "Leading Expert",
        tagline: "I review large code changes outside my domain",
        criteria: [
          {
            text: "Quality of your CRs stays on top level even in repositories you're not familiar with or repositories outside of Emplifi",
          },
        ],
      },
    ],
  },
  {
    id: "emplifi-domain-knowledge",
    name: "Emplifi Domain Knowledge",
    dimensions: [
      "Repositories",
      "Patterns",
      "Architecture",
      "Internal Tooling",
      "Processes",
      "Self-reliance",
    ],
    levels: [
      {
        number: 1,
        key: "beginner",
        label: "Beginner",
        tagline: "I'm familiar with areas of my daily work",
        criteria: [
          {
            text: "Understand your main repository enough to work independently most of the time",
          },
          {
            text: "You are able to work on more complex tasks inside of your main repositories, even if it takes a bit longer than for experienced developers",
          },
          {
            text: "Understand how and can use common Emplifi apps (eg. postman, maratonec, etc.)",
          },
          {
            text: "Understand release flow used in Emplifi in your main repositories and respect it during release (RC train, CICD, automatic/manual deployment)",
          },
          {
            text: "You know that different repositories can have different release flow in Emplifi and you are familiar with most of them",
          },
        ],
      },
      {
        number: 2,
        key: "intermediate",
        label: "Intermediate",
        tagline: "I know our architecture and can mostly work on my own",
        criteria: [
          {
            text: "Understand difference between Emplifi repositories and reasons for these differences (for example - difference between Paid and Content Hub)",
          },
          { text: "Can finish your tasks in reasonable amount of time" },
          {
            text: "Understand the current architecture of your repositories and reasons behind it",
          },
          {
            text: "Understand how apps communicate between each other (hera/prefixes/sockets/SMC/…)",
          },
          { text: "Can solve most of your tasks by yourself" },
          { text: "You are able to create new repository when needed" },
        ],
      },
      {
        number: 3,
        key: "advanced",
        label: "Advanced",
        tagline: "I create new projects and continuously improve existing ones",
        criteria: [
          {
            text: "You have proven experience of creating new applications/services on your own which contains at least these parts:",
            subcriteria: [
              "Repository/configuration in maratonec",
              "Functional stack",
              "Working repository architecture others can start using and contributing",
            ],
          },
          {
            text: "You are actively coming up with solutions for making our repositories better",
          },
          {
            text: "You are actively working with repositories documentation and your changes are reflected in it",
          },
          {
            text: "You are able to have high level conversations about current architecture and codebase. You are actively improving both of them.",
          },
          {
            text: "You are able to effectively finish complex tasks spanning multiple repositories by yourself",
          },
          {
            text: "Understand the technical evolution of our products. Understands how to work with older parts of code in them",
          },
          { text: "Can orient yourself in any repository quickly" },
        ],
      },
      {
        number: 4,
        key: "expert",
        label: "Expert",
        tagline: "I'm improving & creating architecture across projects",
        criteria: [
          { text: "You are able to participate in every relevant repository" },
          {
            text: "You are able to design and create (and proven that multiple times) repositories that are easy to maintain and develop in",
          },
          {
            text: "You are able to address past failures (or stuff that went really well) and pinpoint what was the origin and make better decisions based on that experience",
          },
          {
            text: "You are able to answer almost any domain question that could be asked",
          },
          {
            text: "Understand others technologies used in Emplifi engineering",
          },
        ],
      },
      {
        number: 5,
        key: "leadingExpert",
        label: "Leading Expert",
        tagline: "No code & functionality is strange to me",
        criteria: [
          { text: "Can work effectively and efficiently in any repo" },
          {
            text: "Have extensive knowledge of both (platform and feature) areas of our codebase",
          },
          { text: "You are helping to create and maintain Emplifi tools" },
        ],
      },
    ],
  },
  {
    id: "technology-knowledge",
    name: "Technology Knowledge",
    dimensions: [
      "Devstack",
      "Libraries",
      "Tooling",
      "Testing",
      "Languages",
    ],
    levels: [
      {
        number: 1,
        key: "beginner",
        label: "Beginner",
        tagline: "I have basic knowledge of technologies used in my team",
        criteria: [
          {
            text: "Understand common use cases for used technologies in Emplifi",
          },
          { text: "Can replicate and modify code in those technologies" },
          {
            text: "You are aware of implementation complexity and take into account when working on code",
          },
          {
            text: "You are able to use existing tests to cover your new code",
          },
        ],
      },
      {
        number: 2,
        key: "intermediate",
        label: "Intermediate",
        tagline:
          "I understand how we use various technologies in our department",
        criteria: [
          {
            text: "Have deeper understanding and longer experience with relevant technologies.",
          },
          {
            text: "Understand most of the important APIs of relevant technologies and can use them to solve problems yourself",
          },
          {
            text: "Can debug effectively to find and fix problems that occur during implementation or when fixing bugs.",
          },
          {
            text: "You are able to modify devstack with a good understanding of the consequences.",
          },
          {
            text: "Can write (and are actively doing it) new unit tests from scratch to cover even more difficult areas of code.",
          },
        ],
      },
      {
        number: 3,
        key: "advanced",
        label: "Advanced",
        tagline:
          "I'm spending significant time learning about new technologies",
        criteria: [
          {
            text: "Have excellent understanding of most relevant technologies, how they should be used together, what are the common problems and how to solve them.",
          },
          {
            text: "Have worked with most relevant technologies for long enough so that you are rarely surprised by anything new they have to offer.",
          },
          {
            text: "You are actively keeping track of new technologies to keep yourself informed of new possibilities for future development.",
          },
          {
            text: "You are able to debug code effectively using advanced techniques if needed to find issues (implementation, performance, memory, etc.)",
          },
          {
            text: "Can write solid tests regardless of test framework used (jest/mocha/etc.).",
          },
          {
            text: "Participate in initiatives that improve the technology stack used in repositories",
          },
        ],
      },
      {
        number: 4,
        key: "expert",
        label: "Expert",
        tagline:
          "I have learned about lots of libraries and I am able now to quickly orient myself in whatever is currently used & popular",
        criteria: [
          {
            text: "You are able to understand technologies outside of company scope and orient yourself in them quickly",
          },
          {
            text: "You are able to answer most of the questions related to relevant technological knowledge",
          },
          {
            text: "You are able to send a PR to open source repositories to fix more complex issues.",
          },
        ],
      },
      {
        number: 5,
        key: "leadingExpert",
        label: "Leading Expert",
        tagline: "I quickly adopt and use new technologies",
        criteria: [
          { text: "Have deep understanding of technologies you are using" },
          {
            text: "You are able to quickly grasp usable knowledge about most of the technologies and use them in a correct way",
          },
          {
            text: "Can create working prototypes with new technologies in a fast and understandable way for others in engineering",
          },
        ],
      },
    ],
  },
  {
    id: "problem-solving",
    name: "Problem Solving",
    dimensions: [
      "Analysis",
      "Debugging",
      "Research",
      "Reliability",
      "Decision making",
    ],
    levels: [
      {
        number: 1,
        key: "beginner",
        label: "Beginner",
        tagline: "I know how to debug my projects & tools",
        criteria: [
          {
            text: "Orient yourself in your team's area of responsibility and solve small issues",
          },
          { text: "Let others know when you're stuck and ask for help" },
          { text: "You make small decisions by yourself" },
          {
            text: "You're familiar with debugging tools",
            subcriteria: ["e.g. console, breakpoints, devtools"],
          },
        ],
      },
      {
        number: 2,
        key: "intermediate",
        label: "Intermediate",
        tagline: "I help others to find multiple solutions and evaluate them",
        criteria: [
          { text: "You help others in your team when they are stuck" },
          {
            text: "When encountering a bug in an application you can identify the relevant broken code",
          },
          {
            text: "While solving a problem you find multiple solutions and pick the best one",
            subcriteria: [
              "best solution is the one that prevents future problems",
              "it's either consistent or is a planned innovation",
            ],
          },
          {
            text: "Your solutions are easily understood by others",
            subcriteria: [
              "e.g. not doing large diff, following code standards",
              "understanding that someone else will go through your solution",
            ],
          },
          {
            text: "You always fix the root cause of the issue and not just the consequences",
            subcriteria: ["examples?"],
          },
          {
            text: "You reach out to the right people when stuck and are able to provide good explanation of the problem",
          },
        ],
      },
      {
        number: 3,
        key: "advanced",
        label: "Advanced",
        tagline: "I'm quickly fixing problems with good results",
        criteria: [
          { text: "Problems don't block you for too long" },
          {
            text: "You can fix a problem in your team's domain without help",
          },
          {
            text: "You can use advanced debugging tools",
            subcriteria: [
              "memory snapshots, performance timelines, flame charts, profilers, conditional breakpoints, navigating the call stack, context & scope",
            ],
          },
          {
            text: "When given a task with functionality you have not encountered before, you know how to move forward, research it and eventually come up with a solution",
          },
          {
            text: "You're aware of your programming language constructs, inner workings and how they affect performance",
            subcriteria: [
              "e.g. understanding big O notation, Node.js threading / event loop, …",
            ],
          },
          { text: "You analyze hardships in a new user stories" },
          {
            text: "You evaluate solutions of other people, discuss them and point out to possible problems",
            subcriteria: ["not just CRs"],
          },
          {
            text: "Can compare the benefits of rewriting or fixing code and choose the best approach",
          },
        ],
      },
      {
        number: 4,
        key: "expert",
        label: "Expert",
        tagline: "I solve problems across engineering",
        criteria: [
          {
            text: "Rarely encounter an issue that you have not seen before",
          },
          {
            text: "Very fast when fixing bugs, using the best available tools",
          },
          { text: "Helping to solve problems across whole engineering" },
          { text: "Orienting yourself outside of your team's domain" },
          { text: "Improving others' ability to solve problems" },
          {
            text: "You are able to research & implement complex algorithms",
          },
        ],
      },
      {
        number: 5,
        key: "leadingExpert",
        label: "Leading Expert",
        tagline: "I relentlessly focus on problem solving",
        criteria: [
          { text: "Solve issues across the whole company" },
          { text: "You're reliable part of the company" },
          { text: "Pay attention to detail" },
        ],
      },
    ],
  },
  {
    id: "learning-concepts",
    name: "Learning Concepts",
    dimensions: ["Adaptability", "Activity", "Practice", "Sharing"],
    levels: [
      {
        number: 1,
        key: "beginner",
        label: "Beginner",
        tagline: "I'm asking questions when I don't understand something",
        criteria: [
          { text: "Watch and participate in your team's CRs" },
          { text: "Ask questions about things you do not understand" },
          {
            text: "You learn from previous experiences and don't repeat your own mistakes",
          },
          {
            text: "You're able to adapt to existing solutions",
            subcriteria: [
              "e.g. codebase, architecture, concepts, problems",
            ],
          },
          { text: "Attend relevant workshops" },
          {
            text: "Use NPDDs for studying & improving your developer skills",
          },
        ],
      },
      {
        number: 2,
        key: "intermediate",
        label: "Intermediate",
        tagline:
          "I'm thinking about my work finding ways to keep improving it and myself",
        criteria: [
          { text: "You're confident in your team's area of expertise" },
          {
            text: "Come up with questions, ideas and risks to proposed functionality",
          },
          {
            text: "You're able to orient yourself in others work after introduction",
          },
          {
            text: "Analyze code of other developers and learn from it",
            subcriteria: ["e.g. CRs"],
          },
          { text: "Follow guilds relevant to your job" },
          { text: "You learn by solving problems by yourself" },
          { text: "You discuss your learning plans with your manager" },
        ],
      },
      {
        number: 3,
        key: "advanced",
        label: "Advanced",
        tagline: "I use various ways of improving myself",
        criteria: [
          { text: "You read & analyze third party code" },
          {
            text: "You practice learned concepts to understand them better",
          },
          {
            text: "You look for new things to learn to keep improving yourself",
          },
          { text: "You participate in guilds relevant to you" },
          {
            text: "You learn by teaching others",
            subcriteria: ["Pair programming, techtalks, workshops"],
          },
          { text: "You set up long term learning goals for yourself" },
        ],
      },
      {
        number: 4,
        key: "expert",
        label: "Expert",
        tagline: "I'm owning guilds or initiatives in our organization",
        criteria: [
          {
            text: "You spend time learning concepts across all of our products",
            subcriteria: ["E.g. react-query vs redux-saga"],
          },
          { text: "You own or co-own a guild & push it forward" },
          { text: "You share ideas for others to see" },
          {
            text: "You try to see how the guild could be used to improve our projects",
          },
          { text: "Organize guild meetings for interesting topics" },
          {
            text: "You can quickly orient yourself and use new technologies",
            subcriteria: [
              "Libraries, frameworks, new code, other company projects",
            ],
          },
          {
            text: "You've been continuously using most available learning tools for a long period of time",
            subcriteria: [
              "E.g. workshops, techtalks, courses, CRs, NPDDs, internet tools, …",
            ],
          },
          {
            text: "You are a mentor for others and use it to improve yourself",
          },
        ],
      },
      {
        number: 5,
        key: "leadingExpert",
        label: "Leading Expert",
        tagline:
          "I'm coming up with new ideas and ways for others to learn",
        criteria: [
          {
            text: "You push the company to implement new learning tools",
          },
          { text: "You have mastered learning new things" },
        ],
      },
    ],
  },
];

/** Lookup competency by stable id. */
export function getHardSkillCompetency(id: string) {
  return getSkillCompetencyById(HARD_SKILL_COMPETENCIES, id);
}
