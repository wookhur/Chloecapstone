-- ============================================================================
-- Yeon (緣) — Seed data for the pilot demo
-- Run AFTER schema.sql. Gives you a coordinator, mentors, mentees, and a few
-- in-progress matches/sessions so every screen has something to show.
-- ============================================================================

-- Coordinator ---------------------------------------------------------------
insert into profiles (id, name, role, grade, interests, communication_style, personality_tags, availability, bio)
values
  ('00000000-0000-0000-0000-000000000001', 'Chaehyun', 'coordinator', 12,
   '{community,leadership,music}', 'supportive', '{empathetic,connector,trustworthy}',
   '{Mon-PM,Wed-PM,Fri-PM}', 'Matching coordinator & community lead for Yeon.');

-- Mentors -------------------------------------------------------------------
insert into profiles (id, name, role, grade, subjects, interests, communication_style, personality_tags, availability, bio)
values
  ('00000000-0000-0000-0000-000000000011', 'Jisoo Park', 'mentor', 12,
   '[{"subject":"Calculus","strength":5},{"subject":"Physics","strength":4}]',
   '{robotics,chess,basketball}', 'structured', '{patient,organized}',
   '{Mon-PM,Wed-PM,Sat-AM}', 'AP Calc & Physics. Loves breaking big problems into small steps.'),

  ('00000000-0000-0000-0000-000000000012', 'Daniel Cho', 'mentor', 11,
   '[{"subject":"Chemistry","strength":5},{"subject":"Biology","strength":4}]',
   '{biology,cooking,kpop}', 'supportive', '{warm,encouraging}',
   '{Tue-PM,Thu-PM,Sun-PM}', 'Future pre-med. Makes chem feel less scary.'),

  ('00000000-0000-0000-0000-000000000013', 'Mina Seo', 'mentor', 12,
   '[{"subject":"English Literature","strength":5},{"subject":"History","strength":4}]',
   '{debate,reading,film}', 'direct', '{candid,motivating}',
   '{Mon-PM,Thu-PM,Sat-PM}', 'Essay structure & close reading. Honest, fast feedback.'),

  ('00000000-0000-0000-0000-000000000014', 'Kevin Lim', 'mentor', 11,
   '[{"subject":"Computer Science","strength":5},{"subject":"Calculus","strength":3}]',
   '{coding,gaming,robotics}', 'easygoing', '{chill,creative}',
   '{Wed-PM,Fri-PM,Sun-PM}', 'CS & intro Python. We build small projects together.'),

  ('00000000-0000-0000-0000-000000000015', 'Soyeon Han', 'mentor', 12,
   '[{"subject":"Spanish","strength":5},{"subject":"English Literature","strength":3}]',
   '{languages,travel,music}', 'supportive', '{friendly,patient}',
   '{Tue-PM,Thu-PM,Sat-AM}', 'Bilingual. Conversation-first language practice.');

-- Mentees -------------------------------------------------------------------
insert into profiles (id, name, role, grade, is_new_student, subjects, interests, communication_style, personality_tags, availability, bio)
values
  ('00000000-0000-0000-0000-000000000021', 'Yuna Kim', 'mentee', 9, true,
   '[{"subject":"Calculus","need":5}]',
   '{chess,basketball,robotics}', 'structured', '{shy,curious}',
   '{Mon-PM,Sat-AM}', 'New 9th-grade transfer. Math moves fast here.'),

  ('00000000-0000-0000-0000-000000000022', 'Ethan Yoon', 'mentee', 10, false,
   '[{"subject":"Chemistry","need":4}]',
   '{cooking,kpop,biology}', 'supportive', '{friendly,anxious-about-tests}',
   '{Tue-PM,Sun-PM}', 'Want to feel calm before chem quizzes.'),

  ('00000000-0000-0000-0000-000000000023', 'Hana Lee', 'mentee', 9, true,
   '[{"subject":"English Literature","need":5}]',
   '{reading,film,debate}', 'direct', '{determined}',
   '{Mon-PM,Thu-PM}', 'New student. Need help with analytical essays.'),

  ('00000000-0000-0000-0000-000000000024', 'Leo Jung', 'mentee', 10, false,
   '[{"subject":"Computer Science","need":4}]',
   '{gaming,coding,robotics}', 'easygoing', '{playful,self-taught}',
   '{Wed-PM,Sun-PM}', 'Can code a bit, want to get serious about it.'),

  ('00000000-0000-0000-0000-000000000025', 'Sara Moon', 'mentee', 11, false,
   '[{"subject":"Spanish","need":3}]',
   '{travel,music,languages}', 'supportive', '{outgoing}',
   '{Tue-PM,Sat-AM}', 'Conversational Spanish for an exchange trip.'),

  ('00000000-0000-0000-0000-000000000026', 'Noah Bae', 'mentee', 9, true,
   '[{"subject":"Physics","need":4},{"subject":"Calculus","need":3}]',
   '{basketball,chess,gaming}', 'structured', '{quiet,hardworking}',
   '{Mon-PM,Sat-AM}', 'New here. Physics feels overwhelming.');

-- An active, healthy match with a short session history ----------------------
insert into matches (id, mentor_id, mentee_id, subject, status, requested_by, score, score_breakdown, coordinator_note)
values
  ('00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000011', -- Jisoo (mentor)
   '00000000-0000-0000-0000-000000000021', -- Yuna (mentee)
   'Calculus', 'active', 'mentee', 88,
   '{"subject":40,"compatibility":31,"time":10,"coordinator":7}',
   'Both love chess & robotics — great rapport early on.');

insert into sessions (match_id, session_no, date, topic, duration_min, satisfaction, relationship_fit, mentee_growth)
values
  ('00000000-0000-0000-0000-000000000101', 1, current_date - 21, 'Limits & continuity', 60, 4, 'good', false),
  ('00000000-0000-0000-0000-000000000101', 2, current_date - 14, 'Derivatives intro',   60, 5, 'good', false),
  ('00000000-0000-0000-0000-000000000101', 3, current_date - 7,  'Chain rule practice',  60, 5, 'good', true);

-- A pending request waiting for a mentor to accept --------------------------
insert into matches (id, mentor_id, mentee_id, subject, status, requested_by, score, score_breakdown)
values
  ('00000000-0000-0000-0000-000000000102',
   '00000000-0000-0000-0000-000000000013', -- Mina (mentor)
   '00000000-0000-0000-0000-000000000023', -- Hana (mentee)
   'English Literature', 'requested', 'mentee', 84,
   '{"subject":40,"compatibility":29,"time":10,"coordinator":5}');
