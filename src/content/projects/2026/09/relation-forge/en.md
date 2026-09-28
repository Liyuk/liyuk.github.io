---
title: "RelationForge: Make Sense of an Interaction Before You Respond"
description: "Some relationships leave you uneasy, but you cannot quite say why. RelationForge can help you make sense of what happened, including your part in it."
createdAt: 2026-09-28
publishedAt: 2026-09-28
locale: en
translationStatus: reviewed
status: active
repositoryUrl: https://github.com/Liyuk/relation-forge
draft: false
tags: [agent, interpersonal-analysis, anti-scam, privacy, workflow]
translationKey: 2026/09/relation-forge
---

Some relationships leave you uneasy, but it can be hard to say exactly why. Maybe someone has asked you to do something you do not want to do. Maybe, after an argument, you keep wondering whether you were too harsh. Things are still unfolding, and you are not sure what to say next or whether to keep talking.

That is where I hope RelationForge can help. You can share what happened, the relevant messages, and what you are unsure about, then ask it to help you look at what the other person is asking for and how you responded. For example, you ask whether an investment platform can be verified, and they reply, “Don’t you trust me?” Looking closely at that exchange can help you see what you still need to ask.

I also want it to help people look at their own behavior. You may have been trying to move work along when you chased a colleague for materials, but the words you used may have left them feeling publicly belittled. The delay still needs to be addressed, and you can change how you express yourself. It helps to look at both.

The project currently has two Skills for Codex and Claude Code. “Person Analysis” is for looking at personal profiles, conversations, and your own experiences. “Interaction Risk Analysis” focuses more on requests for money, pressure, threats, and possible bullying. I’ve put the installation instructions [below](#install-relation-forge); you can also go straight to the [GitHub repository](https://github.com/Liyuk/relation-forge).

## Five situations, and how RelationForge responds

The examples about money requests in online relationships, investment pitches, and workplace feedback draw on the public sources linked in each example. The responses preserve the judgments, reasoning, and possible next steps from the trial runs, so you can compare them with your own questions.

### 1. I was only chasing a deadline. Why did my colleague feel humiliated?

**Scenario**: Your colleague missed the agreed deadline for materials needed in a project summary. In a group chat with other colleagues, you wrote, “You do this every time. You’re completely unreliable.” Your colleague then sent you a private message explaining what happened, but you did not reply that day. The next day, they said they felt humiliated in front of the group. You thought you were protecting the schedule, but now want to understand how your words and silence affected them, and how to ask for the work without making the conflict worse.

**Person Analysis responds**:

> Your message went beyond reminding them about a deliverable. “You do this every time. You’re completely unreliable” turns one known delay into a judgment about the whole person, and you said it in the project group. The colleague explicitly said the next day that they felt publicly humiliated. You were trying to keep the project on track, but that does not erase the effect of what you said. Not replying that day may have left your colleague feeling that you had dismissed their explanation. We do not know why you did not reply, so we cannot conclude that you meant to punish them.
>
> There are still things to find out: why the materials were late, whether similar incidents had happened before, what your colleague explained in the private message, and how the delay affected the project. You could reply privately and apologize, acknowledging that it was wrong to judge them in the group. Do not follow the apology with “but you were late first.” You could also ask whether they would be comfortable with you briefly correcting what you said in the group chat. Do not share their private message.
>
> Then deal with the work separately: say which materials are missing, what they affect, when they are needed, and when your colleague should let you know if there is a problem. If you need time before replying in the future, say when you will get back to them.

### 2. A dating profile says nothing about marriage or children. Is that concealment, or a different pace?

**Scenario**: Someone’s dating profile says, “I like hiking and cooking, and hope to build a serious relationship.” It says nothing about income, marital history, or whether they want children. You have been chatting for only a few days when you ask how they feel about marriage and children. They reply, “Let’s get to know each other first; we can talk about that later.” You keep chatting normally, with no clear contradictions or requests for money. You worry that they may be deliberately hiding something and want to know what you can conclude so far, and how to learn more without treating a guess as fact.

**Person Analysis responds**:

> So far, you can confirm that the person said they like hiking and cooking and want to pursue a serious relationship. You cannot confirm their actual plans for marriage or children, and there is not enough evidence to say they are deliberately hiding something. The profile does not mention income, marital history, or whether they want children; those are things you do not know yet. After only a few days of chatting, “Let’s get to know each other first; we can talk about that later” could mean they want to take things slowly, or that they have not figured it out yet. They are still chatting normally, with no clear contradictions or requests for money. At this point, that is not enough to conclude they are deceiving you.
>
> You want to know early whether you are a good fit; for now, the other person wants to put off the conversation. You may simply want to discuss this sooner than they do. You still do not know what “serious” means to each of you, whether they have an initial view on children, or when they would be willing to talk about it. You can share your own preferences and suggest discussing your general outlook the next time you have a deeper conversation. There is no need to ask for an immediate commitment. If they keep avoiding the topic or their answers conflict later, take another look at the situation. Even without deception, a mismatch in pace can be a reason to invest less.

### 3. My manager corrected a mistake. Is that bullying?

**Scenario**: Caro’s report contained a numerical error. Her manager, Ray, pointed it out privately, explained how to fix it, and gave her two days to make the change. There is no mention of public humiliation or threats. Caro feels the criticism was unfair and believes Ray is bullying her. She asks whether that feeling alone is enough to establish bullying and what else she should find out. [Acas’s guidance on workplace bullying](https://www.acas.org.uk/bullying-at-work/if-you-think-youre-being-bullied) also distinguishes constructive correction at work from bullying behavior.

**Interaction Risk Analysis responds**:

> Feeling hurt deserves to be taken seriously, but that feeling alone is not enough to show that Ray is bullying you. From what you have shared, the report did contain a numerical error. Ray pointed it out privately, explained how to fix it, and gave you two days; there is no mention of public humiliation or threats. Based on what you know so far, this sounds more like correction of a specific piece of work than bullying. Your manager wants the report to be accurate, and you want feedback to be fair and respectful. Both can be true.
>
> There are still things to find out: Ray’s exact words and tone, whether two days was a reasonable deadline, whether the same standards apply to everyone, and whether there has been a pattern of belittling or exclusion, or retaliation after you raised a concern. You could check the error and what the corrected report needs to include, then explain what resources you need. You can also point to the specific words that made you uncomfortable.
>
> If there has been other ongoing misconduct, keep a dated record of specific incidents and ask a trusted colleague or someone in your organization about your options. You do not have to resolve this by arguing over whether the label fits.

### 4. Someone I met online keeps asking for money. Would refusing be cold-hearted?

**Scenario**: You met on a dating app three weeks ago and chat almost every day. The other person says they work overseas and plan to visit next month, but has canceled two video calls at the last minute. First they say their mother is in the hospital and they need help with the bill. A few days later, they say their car broke down and ask you to send money again, this time to an overseas account. You have not sent anything. Refusing feels cold, but you cannot independently verify these explanations either. You ask: “Is this a warning sign? What can I check? What should I do now?” A similar pattern appears in the [FTC’s example of a romance scam](https://consumer.ftc.gov/media/video-0119-online-romance-imposter-scams).

**Interaction Risk Analysis responds**:

> These are warning signs; pause before sending any money. They do not prove who the other person is or why they are asking. You have known each other for three weeks and chat almost every day. They say they work overseas and will visit next month, but have canceled two video calls at the last minute. First they asked for money because their mother was in the hospital, then because their car had broken down. Both times, they asked you to send money to an overseas account. As you grow closer, it may get harder to say no, while the financial risk falls on you.
>
> The questions still open are who they really are, whether the emergencies are real, who owns the receiving account, and whether they will accept a refusal. You could arrange a video call and check their claim about work using contact details for the employer that you find independently. Even a successful video call would not prove that their reasons for asking for money are true.
>
> Do not send money or share your account information; that follows the [FTC’s advice on romance scams](https://consumer.ftc.gov/articles/what-know-about-romance-scams). Refusing to send money is not the same as being cold-hearted. If they keep pressuring you, you can stop responding and report the account to the dating platform.

### 5. How did a serious relationship turn into pressure to invest?

**Scenario**: Day 1: You meet Alex on a dating app. They say they work as an investment adviser in Seattle. Day 8: Alex says they want a serious relationship and asks to move the conversation to Telegram. Day 15: Alex says their phone is broken and they cannot video call, but starts introducing an investment platform. Day 17: Alex sends a screenshot of profits, asks you to transfer $5,000 that night, and tells you to keep it secret. When you ask to verify the company, Alex replies, “Don’t you trust me?” You want to know what can be confirmed, whether this is an escalating pattern or an ordinary misunderstanding, and what to do now. The FBI’s account of this kind of scam also describes relationship-building, steering someone toward an investment, fake returns, and problems withdrawing money. [FBI/IC3 advisory](https://www.ic3.gov/PSA/2022/psa221003)

**Interaction Risk Analysis responds**:

> Do not transfer the $5,000. The risk has built up step by step: on Day 1, Alex builds credibility by claiming to be an investment adviser in Seattle; on Day 8, they propose a serious relationship and move the conversation to Telegram; on Day 15, they say their phone is broken and they cannot video call, but introduce an investment platform; on Day 17, they use a screenshot of profits to press for payment that night and demand secrecy. When you ask to verify the company, “Don’t you trust me?” turns a factual question into a test of your feelings, leaving less time to check and less room to ask someone else.
>
> Moving to another platform or having a broken phone would not, by itself, prove fraud. Together, though, these are good reasons to stop the transaction. The person’s identity and job, who runs the platform, and where the money would go have not been verified. A screenshot does not prove that the returns are real. You can use [Investor.gov](https://www.investor.gov/introduction-investing/getting-started/working-investment-professional/investment-advisers) to check registration, then contact the company using details you find independently to confirm whether this person works there. A matching name in a registry would not rule out impersonation.
>
> Keep the records you already have and talk it through with someone you trust. Do not send a small amount as a test; you do not have to keep talking to Alex in order to leave.

## Why make it a Skill?

The idea began with things I had noticed at work and with situations friends had run into and later talked to me about. People see the same situation from different positions and care about different things. What they say reflects where they are coming from and what they want. If you hear only one line, it is easy to miss what happened before it or mistake a guess for a fact.

I had something like “reading the air” in mind: start with what people said and did, then work backward. What was each person trying to get? What were they worried about? Why might they have put it that way, and what part of the story has not been told? Then put those clues back into the sequence of events and see whether another explanation fits better. That also means looking back at myself: where was I coming from, and what effect did my words have on someone else?

This is not mind-reading. A few lines are not enough to know what someone really thinks, and a new detail may change an earlier reading. An article can explain this way of looking at things, but when a real conversation leaves you unsure, you still have to remember where to start. I made it a Skill so you can return to the same questions as a situation unfolds: what matters to each person, what has not been said clearly, and what might I have missed? When something new comes up, you can revisit the earlier reading.

<h2 id="install-relation-forge">Install</h2>

| If you want to… | Install this Skill |
|---|---|
| Read a dating profile, understand what someone wants in a conversation, or look back at your own behavior | Person Analysis `person-deep-analysis` |
| Sort through requests for money, investment pitches, pressure in a relationship, or possible bullying | Interaction Risk Analysis `interaction-risk-analysis` |

If you mainly want to understand a conversation or look back at something that happened to you, you can start with Person Analysis. You can also install both.

Install Person Analysis for Codex:

```sh
npx skills add Liyuk/relation-forge --skill person-deep-analysis -g -a codex -y
```

Install Interaction Risk Analysis for Codex:

```sh
npx skills add Liyuk/relation-forge --skill interaction-risk-analysis -g -a codex -y
```

If you use Claude Code, replace `-a codex` in the command with `-a claude-code`. Your chat material is still processed by the platform you use; installing a Skill does not keep it on your device. The analysis is limited to what you provide. It cannot identify someone, determine that a crime took place, or diagnose a personality.

## Bring one thing you want to understand

You do not need to paste an entire chat history. Pick the lines that are bothering you, explain what was happening, and say what you are unsure about. Before sharing them, remove names, account details, and contact information.

For example, to look back at a conflict of your own:

```text
$person-deep-analysis
This was a conflict between me and a colleague. I want to understand what mattered to each of us,
which of my words may have made things harder, and what I could say next time.
[What happened and the relevant messages]
```

If someone’s request makes you uneasy:

```text
$interaction-risk-analysis
They made this request, and these things happened after I said no.
Help me see how the pressure changed over time and what information is worth checking.
[Relevant details in chronological order]
```

If an explanation does not match what actually happened, say so directly: “That’s not what happened; there was another thing before that.” You can add later details too and see whether the first reading still holds. If you just want to understand what happened, you can stop there. If you need help deciding how to respond, keep going.

If a relationship is making you uncomfortable, something still does not make sense, or you are going through a difficult situation right now, bring it to RelationForge. Start with the part that is troubling you most and use it to sort through what may be going on.
