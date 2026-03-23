/**
 * Emplifi soft-skills evaluation rubric (source: internal skill evaluation page).
 * Shared level scale and types: `skill-rubric-common`.
 */

export {
  SKILL_LEVEL_DEFINITIONS as SOFT_SKILL_LEVEL_DEFINITIONS,
  SKILL_LEVEL_KEYS as SOFT_SKILL_LEVEL_KEYS,
  flattenSkillCriteriaStrings as flattenCriteriaStrings,
  type SkillCompetency as SoftSkillCompetency,
  type SkillCriterion as SoftSkillCriterion,
  type SkillLevelDefinition as SoftSkillLevelDefinition,
  type SkillLevelKey as SoftSkillLevelKey,
  type SkillLevelNumber as SoftSkillLevelNumber,
  type SkillLevelRubric as SoftSkillLevelRubric,
} from "./skill-rubric-common";

import type { SkillCompetency } from "./skill-rubric-common";
import { getSkillCompetencyById } from "./skill-rubric-common";

export const SOFT_SKILL_SUITABLE_ROLES = [
  "Software Engineer II",
  "Coder II",
] as const;

export const SOFT_SKILL_COMPETENCIES: SkillCompetency[] = [
  {
    id: "mentoring",
    name: "Mentoring",
    dimensions: [
      "Setting an example",
      "Encouraging",
      "Knowledge sharing",
      "Guiding others",
      "Being available",
    ],
    levels: [
      {
        number: 1,
        key: "beginner",
        label: "Beginner",
        tagline: "I'm mentoring by example and eager to improve.",
        criteria: [
          {
            text: "Follow through on your promises to serve as a good example",
          },
          {
            text: "Communicate problems you struggle with to the rest of the team",
          },
          {
            text: "You walk someone through tasks step-by-step that you're more comfortable with such as",
            subcriteria: ["pair programming", "meeting management"],
          },
          { text: "You praise others and are supportive" },
        ],
      },
      {
        number: 2,
        key: "intermediate",
        label: "Intermediate",
        tagline: "I'm reaching out to other people to help them.",
        criteria: [
          {
            text: "Proactively help with onboarding of new team members",
          },
          {
            text: "Go out of your way to help others, make yourself available to answer questions and listen carefully",
          },
          { text: "Encourage others to improve themselves" },
          { text: "Encourage to ask questions" },
          {
            text: "Encourage to learn & search for solutions for themselves to make them more self-reliant",
          },
          {
            text: "Encourage to come up with multiple solutions to their problems",
          },
          {
            text: "Push junior developers to early adopt good practices",
          },
        ],
      },
      {
        number: 3,
        key: "advanced",
        label: "Advanced",
        tagline:
          "I'm providing deeper guidance on an individual level and reaching out to more people.",
        criteria: [
          {
            text: "Mentor team members and spend time with them individually or use team level presentations to increase knowledge",
          },
          {
            text: "On discovery of a new interesting information/functionality you consider sharing it with the team or engineering techtalk - and if it fits present it",
          },
          {
            text: "Guide junior developers by asking questions rather than giving them answers",
          },
          {
            text: "Provide deeper context and perspective based on your knowledge and experience",
          },
          {
            text: "Mentor by example and embody good qualities others can follow",
          },
        ],
      },
      {
        number: 4,
        key: "expert",
        label: "Expert",
        tagline:
          "I'm helping everyone to improve by leading and sharing knowledge",
        criteria: [
          {
            text: "Look for gaps in knowledge of team members and fill them in",
          },
          {
            text: "Create company-level workshops for topics you are knowledgeable in",
          },
          {
            text: "Encourage others to share things they learned with the rest of the team",
          },
          {
            text: "Successfully lead other developers to reach higher ladder levels",
          },
          {
            text: "Updates project documentation with deeper explanation on areas of your knowledge",
          },
          {
            text: "Introduce junior developers to other teams and help them build connections so they are more self-reliant",
          },
          {
            text: "Initiate pair CR's to help others learn how to CR better",
          },
        ],
      },
      {
        number: 5,
        key: "leadingExpert",
        label: "Leading Expert",
        tagline:
          "I'm creating new mentors and improving means of mentoring",
        criteria: [
          {
            text: "You identify and define clear growth opportunities for those you're mentoring and track progress towards improving in those areas.",
          },
          {
            text: "Create initiatives to improve mentoring across the whole company",
          },
          {
            text: "You are mentoring outside of the company as well - e.g. presenting on conferences",
          },
        ],
      },
    ],
  },
  {
    id: "organizational-skills",
    name: "Organizational Skills",
    dimensions: [
      "Delivery",
      "Prioritization",
      "Planning & understanding capacity",
      "Delegation",
    ],
    levels: [
      {
        number: 1,
        key: "beginner",
        label: "Beginner",
        tagline:
          "I'm trying to finish tasks on time and understand prioritization",
        criteria: [
          { text: "work on understanding of your own capacity" },
          {
            text: "try to fulfill all your tasks on time and always communicate possible delays",
          },
          {
            text: "understand prioritization and what's expected from you",
          },
        ],
      },
      {
        number: 2,
        key: "intermediate",
        label: "Intermediate",
        tagline: "Others can count on my own organizational skill",
        criteria: [
          { text: "understand you own capacity" },
          {
            text: "do not overload yourself - take only as much work as you can handle",
          },
          { text: "don't overcommit - you don't say yes to everything" },
          { text: "do not block fellow colleagues" },
          { text: "communicate realistic expectations" },
          {
            text: "deliver most of your tasks on time and come up with updated plan in case of a delay",
          },
          {
            text: "follow up on your tasks - communicate further if required",
          },
          { text: "schedule the work according the prioritization" },
          {
            text: "while taking new responsibilities, you still do regular engineer tasks",
          },
        ],
      },
      {
        number: 3,
        key: "advanced",
        label: "Advanced",
        tagline:
          "I'm working with my team on team level prioritization and estimates",
        criteria: [
          { text: "you use your organizational skills on the team level" },
          { text: "understanding of the capacity" },
          { text: "scheduling around prioritization" },
          { text: "work with management / product / leadership" },
          { text: "suggest realistic estimates for your tasks" },
          {
            text: "deliver all your tasks on time without sacrificing quality",
          },
          {
            text: "while taking new responsibilities, you're still approachable by others",
          },
        ],
      },
      {
        number: 4,
        key: "expert",
        label: "Expert",
        tagline: "I'm coordinating my team and delegating work efficiently",
        criteria: [
          { text: "have experience being in TO role" },
          { text: "confining input to the team to its limits" },
          { text: "delegate work on your team goals" },
          {
            text: "coordinate the work of the whole team and ensures the delivery",
          },
          { text: "You have lead and managed a project by yourself" },
        ],
      },
      {
        number: 5,
        key: "leadingExpert",
        label: "Leading Expert",
        tagline:
          "I successfully organize & manage everything and everyone",
        criteria: [
          {
            text: "great management of yours and your team's time",
          },
          {
            text: "you combine prioritization and time budgeting which results in excellent work",
          },
        ],
      },
    ],
  },
  {
    id: "collaboration-cooperation",
    name: "Collaboration & Cooperation",
    dimensions: [
      "Communication",
      "Giving and accepting feedback",
      "Be understanding & helpful",
      "Relationships",
    ],
    levels: [
      {
        number: 1,
        key: "beginner",
        label: "Beginner",
        tagline: "I am aware I'm not alone here",
        criteria: [
          { text: "Accept feedback from others" },
          { text: "Actively communicate on slack" },
          { text: "Ask questions of your own" },
          { text: "Respond to others" },
          { text: "You are focused in meetings" },
          {
            text: "Understand life cycle of jira tasks and your responsibility for their delivery",
          },
          {
            text: "Communicate with relevant people when your task is stuck",
          },
          { text: "Try to understand others perspective" },
        ],
      },
      {
        number: 2,
        key: "intermediate",
        label: "Intermediate",
        tagline: "I am actively cooperating in my team",
        criteria: [
          { text: "Provide feedback to others" },
          {
            text: "Prepare for meetings and participate in their purpose",
          },
          { text: "Ask even an unclear/ambiguous questions" },
          { text: "Respond on behalf of your team on slack" },
          { text: "Bring issues to the teams' attention" },
          {
            text: "Understand the value of meetings for successful collaboration",
          },
        ],
      },
      {
        number: 3,
        key: "advanced",
        label: "Advanced",
        tagline:
          "I'm asking others how can I help them and I'm reaching out to other teams",
        criteria: [
          { text: "Ask how to help" },
          {
            text: "Work with people from outside the team effectively",
          },
          { text: "Provide team-level feedback" },
          { text: "Build good relations with other teams" },
          { text: "Reach out to teammates when they get stuck" },
          {
            text: "You are capable of running team meetings on your own",
          },
          { text: "Share all relevant information with others" },
        ],
      },
      {
        number: 4,
        key: "expert",
        label: "Expert",
        tagline: "I'm helping without being prompted",
        criteria: [
          {
            text: "Come up with and lead a team/cross-team initiatives",
          },
          {
            text: "Promote team culture where everyone is trying to be helpful",
          },
          {
            text: "Step up to lead initiatives when the opportunity arises",
          },
          { text: "Help people outside of your team" },
        ],
      },
      {
        number: 5,
        key: "leadingExpert",
        label: "Leading Expert",
        tagline: "I'm teaching others how to collaborate better",
        criteria: [
          { text: "Teach others how to collaborate better" },
          {
            text: "Encourage other team members to step up to opportunities and support them throughout",
          },
        ],
      },
    ],
  },
  {
    id: "accountability",
    name: "Accountability",
    dimensions: [
      "Responsibility",
      "Transparency",
      "Own your work",
      "Focus on the right things",
      "Handling risk",
    ],
    levels: [
      {
        number: 1,
        key: "beginner",
        label: "Beginner",
        tagline: "I'm an individual contributor in this team",
        criteria: [
          { text: "You take responsibility when given" },
          { text: "Not afraid to talk about your mistakes" },
          {
            text: "Asks questions and clarifies what you are responsible for and the scope of the tasks",
          },
          {
            text: "Make your work transparent to the rest of the team",
          },
          {
            text: "Understand deadlines and time constraints on your individual work",
          },
        ],
      },
      {
        number: 2,
        key: "intermediate",
        label: "Intermediate",
        tagline:
          "I'm an individual contributor and I'm a part of this team",
        criteria: [
          {
            text: "Asks for more responsibility when have have the capacity",
          },
          {
            text: "Understand who's responsible for what inside the team / organization",
          },
          {
            text: "You can explain your actions and decisions about the work",
          },
          {
            text: "Understand the team's direction or ask questions to get clarification",
          },
          { text: "Push for clear accountability" },
          {
            text: "Own the risks and work on eliminating them with guidance",
          },
          {
            text: "Own the outcome of your own work and decisions",
          },
        ],
      },
      {
        number: 3,
        key: "advanced",
        label: "Advanced",
        tagline: "We as … team are here to contribute and own our actions",
        criteria: [
          {
            text: "Understand the higher level vision of the team goals and work towards them",
          },
          {
            text: "Own the results of team actions and decisions",
          },
          {
            text: "You divide the team responsibilities so that everyone including you can contribute",
          },
          {
            text: "You shift focus on your work based on the team's priorities",
          },
          {
            text: "Accept the time constraints, deadlines and help the rest of the team define them.",
          },
          {
            text: "Identify and accept the risk of the work of the team.",
          },
          {
            text: "Work on eliminating the team level risks at your own initiative.",
          },
          {
            text: "During a team level crisis, you direct the rest of the team to a solution and are present to own the results.",
          },
        ],
      },
      {
        number: 4,
        key: "expert",
        label: "Expert",
        tagline:
          "I'm a part of this organization and I'm willing to take responsibility to improve it",
        criteria: [
          {
            text: "Understand and own the organizational level goals and how it will affect you and the rest of the team.",
          },
          {
            text: "Able to explain the impact of a given action or a decision to the rest of the organization. Provide a plan on how to eliminate risks or on how to improve the process.",
          },
          {
            text: "You shift focus and change priorities of ongoing projects without any resentment. Understand the role of the team in the organizational goals.",
          },
          {
            text: "Keep other teams and the leadership & management accountable for their actions. Point out mistakes and improvements.",
          },
          {
            text: "Point out gaps of responsibility within the organization and take initiative to improve them.",
          },
          {
            text: "Guide the rest of the team and the organization on how to improve responsibility and transparency.",
          },
        ],
      },
      {
        number: 5,
        key: "leadingExpert",
        label: "Leading Expert",
        tagline:
          "I don't need anyone to talk to me about what accountability is. I'll make sure me, my team and everyone else has it",
        criteria: [
          {
            text: "You keep perfect track of all your tasks, initiatives and responsibilities.",
          },
          { text: "You don't have to be reminded about anything" },
          {
            text: "Aware of what your team is working on down to the lowest level, able to explain to others and owning the results regardless if you ever touched the work.",
          },
          {
            text: "You deliver work on time and if not, the reasoning and the improvement is explained thoroughly through the right channels of communication.",
          },
          {
            text: "When it comes to the team level or organizational level work you're the right person to talk to.",
          },
          {
            text: "Understand complex processes within the organization and you're able to define responsibilities for others.",
          },
          {
            text: "Work towards owning the risks and the impact of higher level initiatives. Point out mistakes and improvements outside of your team.",
          },
          {
            text: "Provide guidance on how to make the organization more accountable.",
          },
          {
            text: "Understand the risks and the potential impact of organizational level decisions.",
          },
          {
            text: "You point out risks and opportunities for the whole organization, take initiative on making people aware of them and take action when necessary.",
          },
        ],
      },
    ],
  },
  {
    id: "conflict-resolution",
    name: "Conflict Resolution",
    dimensions: [
      "Discuss",
      "De-escalate",
      "Be understanding & reasonable",
      "Compromise & Resolve",
    ],
    levels: [
      {
        number: 1,
        key: "beginner",
        label: "Beginner",
        tagline: "I don't avoid conflicts and try my best to resolve them",
        criteria: [
          { text: "When dealing with conflicts you ask for help." },
          { text: "In stressful situations you try to be calm" },
          { text: "You can explain your decisions in written form" },
          {
            text: "You understand the necessity of conversation to resolve conflicts",
          },
          {
            text: "While looking for solutions you include others and don't hide from a discussion",
          },
          {
            text: "You stick to relevant facts, focus on the problem and don't attack the person",
          },
          {
            text: "You give others time to explain their point of view",
          },
          {
            text: "Avoid building contempt over time by dealing with conflicts",
          },
        ],
      },
      {
        number: 2,
        key: "intermediate",
        label: "Intermediate",
        tagline:
          "I'm actively solving conflicts and getting acceptable results",
        criteria: [
          { text: "You articulate the desired outcome" },
          {
            text: "You are aware of conflicts and willing to engage and open the discussions",
          },
          {
            text: "You resolve conflicts to find ideal solution or compromise, not to win or to be passive aggressive",
          },
          {
            text: "You go to conflict prepared and aware of the issue",
          },
          {
            text: "You are not over concerned with fault or blame. You are willing to take responsibility for how the situation escalated.",
          },
          {
            text: "You understand that the purpose of conflict resolution is for both sides to get something out of it.",
          },
          { text: "You avoid logical fallacies" },
        ],
      },
      {
        number: 3,
        key: "advanced",
        label: "Advanced",
        tagline:
          "I'm helping the team with their conflicts and having a positive impact on the result",
        criteria: [
          { text: "Aware of certain conflict resolution techniques." },
          { text: "You provide feedback where it is reasonable" },
          {
            text: "You facilitate the right discussions to improve the situation overall.",
          },
          {
            text: "When a resolution is reached on a conflict, you track the actions related to it and make sure the final result is properly recorded.",
          },
          {
            text: "You prepare for the conflict discussions and present data or arguments without escalating the situation further.",
          },
          {
            text: "During team or cross-team meetings, you step in to de-escalate the tension and help people communicate better overall.",
          },
          {
            text: "You help team members identify conflicts so they are not avoided and take initiative on resolving them.",
          },
          {
            text: '"The retro discussion was not concluded in an appropriate way and it may lead to a bigger problem. Let\'s discuss it separately as a team and try to resolve it."',
          },
        ],
      },
      {
        number: 4,
        key: "expert",
        label: "Expert",
        tagline:
          "I'm leading groups or teams through resolving conflicts across departments",
        criteria: [
          {
            text: 'You understand very well that "avoided conflict is escalated conflict".',
          },
          {
            text: "You handle conflicts across departments and help other non-technical or non-product people understand the issues and why we approach them the way we do.",
          },
          {
            text: "When there is a request, you help the team break it down for potential conflicts.",
          },
          {
            text: "You facilitate group discussions with the right people, right preparations and potential outcomes.",
          },
          {
            text: "You teach others how to solve conflicts on an individual level.",
          },
          {
            text: "You have a track record of reaching good compromises within the team or across groups.",
          },
        ],
      },
      {
        number: 5,
        key: "leadingExpert",
        label: "Leading Expert",
        tagline:
          "I'm teaching others inside and outside my team how to approach, prepare and resolve conflicts",
        criteria: [
          {
            text: "You coach groups to prepare for resolving conflicts, how to approach them and how to get results.",
          },
          {
            text: "You run workshops based on past experiences on how to solve conflicts, how to provide feedback during discussions and how to reach an acceptable compromise for all sides.",
          },
          {
            text: "When it comes to conflict you set an example of humility, accept outcomes gracefully and teach others to do the same",
          },
          {
            text: "You sense conflicts among other groups without being introduced to them and push people in the right direction so these are resolved before they blow out of proportion.",
          },
        ],
      },
    ],
  },
];

export function getSoftSkillCompetency(id: string) {
  return getSkillCompetencyById(SOFT_SKILL_COMPETENCIES, id);
}
