# Scenario Quality Gate

## Pass/Fail Criteria

1. Duplicate risk below 0.75 cosine similarity against existing cards.
2. Level match passes vocabulary and grammar complexity rubric.
3. EN/ZH title and summary intent is aligned.
4. At least 2 dialogue variants are present.
5. At least 1 grammar and 1 pronunciation rule are present.
6. Scenario objective is measurable in conversation.

## Manual Review Rubric (0-2 each)

- Clarity of objective
- Naturalness of dialogue
- Coaching actionability
- Cultural appropriateness
- Safety and compliance

Score guidance:
- 9-10: Publish
- 7-8: Publish with minor edits
- <=6: Return to AgentB/AgentC

## Sample Audit For Launch 15

| Scenario ID | Duplicate Risk | Level Match | Terminology | Reviewer Decision |
| --- | --- | --- | --- | --- |
| `daily.intro.small_talk_001` | Low | Pass | Pass | Publish |
| `services.coffee.ordering_001` | Low | Pass | Pass | Publish |
| `travel.hotel_check_in.basic_001` | Low | Pass | Pass | Publish |
| `travel.airport.check_in_001` | Medium | Pass | Pass | Publish with edits |
| `workplace.self_intro.team_001` | Low | Pass | Pass | Publish |
| `workplace.meeting.update_001` | Medium | Pass | Pass | Publish with edits |
| `social.make_plans.weekend_001` | Low | Pass | Pass | Publish |
| `daily.shopping.grocery_001` | Low | Pass | Pass | Publish |
| `healthcare.pharmacy.ask_help_001` | Low | Pass | Pass | Publish |
| `academic.class_discussion_001` | Low | Pass | Pass | Publish |
| `services.customer_support_return_001` | Medium | Pass | Pass | Publish with edits |
| `travel.taxi.destination_001` | Low | Pass | Pass | Publish |
| `workplace.interview.behavioral_001` | Medium | Pass | Pass | Publish with edits |
| `social.networking.event_001` | Low | Pass | Pass | Publish |
| `daily.phone_call.appointment_001` | Low | Pass | Pass | Publish |
